cube('ProjectTimelineProject', {
  extends: MultiProjects,
});

cube('ProjectTimelineProjectStatus', {
  extends: ProjectStatus,
});

cube('ProjectTimelineAssignedUser', {
  extends: ProjectResponsible,
});

cube('ProjectTimelineDocument', {
  extends: Documents,
});

cube('ProjectTimelineTransaction', {
  extends: Transaction,
});

cube('ProjectTimelineTask', {
  extends: Task,
});

cube('ProjectTimelineOperation', {
  extends: Operation,
});

cube('ProjectTimelineThreadMessage', {
  extends: ThreadMessage,
});

cube('ProjectTimelineEventUser', {
  extends: UserEmployee,
});

cube('ProjectTimelineAttachedEmployee', {
  extends: Employees,
});

cube('ProjectResponsibleUser', {
  extends: ProjectResponsible,
});

cube('HistoricalProjectResponsibleUser', {
  extends: ProjectResponsible,
});

const allTimelineColumns = [
  'event_date', 'project_id', 'user_id', 'base_event_id', 'event_type',
  'status_id', 'assigned_user_id', 'document_id', 'document_status',
  'is_confirmed_flag', 'is_shared_flag', 'is_paid_flag',
  'transaction_id', 'transaction_status', 'task_id', 'operation_id',
  'thread_message_id', 'employee_id', 'is_attached_flag',
  'responsible_user_type'
];

const buildTimelineEventSelect = (options) => {
  const requiredKeys = ['event_date', 'project_id', 'user_id', 'base_event_id', 'event_type'];
  for (const key of requiredKeys) {
    if (!(key in options)) {
      console.error(`Missing required key in buildTimelineEventSelect: ${key}`);
      return `  -- ERROR: Missing required key: ${key}`;
    }
  }

  return allTimelineColumns.map(colName => {
    const value = options[colName] || `NULL`;
    return `  ${value} as ${colName}`;
  }).join(',\n');
};

cube('ProjectTimeline', {
  sql: `
    -- CTE переписаны с использованием хелпера buildTimelineEventSelect
    WITH project_creation_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'pce.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Создание проекта'"
      })}
      FROM project_created_event pce JOIN event e ON pce.id = e.id
      WHERE pce.project_id IS NOT NULL
    ),
    status_change_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'psce.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Изменение статуса проекта'",
        status_id: 'psce.status_id'
      })}
      FROM project_status_changed_event psce JOIN event e ON psce.id = e.id
      WHERE psce.project_id IS NOT NULL
    ),
    responsible_change_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'pruce.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Назначение ответственного'",
        assigned_user_id: 'pruce.responsible_user_id',
        responsible_user_type: 'pruce.responsible_user_type'
      })}
      FROM project_responsible_user_changed_event pruce JOIN event e ON pruce.id = e.id
      WHERE pruce.project_id IS NOT NULL
    ),
    document_creation_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Создание документа'",
        document_id: 'dce.document_id'
      })}
      FROM document_created_event dce
      JOIN event e ON dce.id = e.id JOIN document d ON dce.document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    doc_status_change_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Изменение статуса документа'",
        document_id: 'dsce.document_id',
        document_status: 'dsce.document_status'
      })}
      FROM document_status_changed_event dsce
      JOIN event e ON dsce.id = e.id JOIN document d ON dsce.document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    doc_confirmed_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Подтверждение документа'",
        document_id: 'dce.document_id',
        is_confirmed_flag: 'dce.is_confirmed'
      })}
      FROM document_confirmed_event dce
      JOIN event e ON dce.id = e.id JOIN document d ON dce.document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    doc_shared_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Публикация документа'",
        document_id: 'dse.document_id',
        is_shared_flag: 'dse.is_shared'
      })}
      FROM document_shared_event dse
      JOIN event e ON dse.id = e.id JOIN document d ON dse.document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    doc_paid_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Оплата документа'",
        document_id: 'dpe.document_id',
        is_paid_flag: 'dpe.is_paid'
      })}
      FROM document_paid_event dpe
      JOIN event e ON dpe.id = e.id JOIN document d ON dpe.document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    transaction_status_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'd.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Изменение статуса транзакции'",
        document_id: 't.base_document_id',
        transaction_id: 'tsce.transaction_id',
        transaction_status: 'tsce.transaction_status'
      })}
      FROM transaction_status_changed_event tsce
      JOIN event e ON tsce.id = e.id JOIN transaction t ON tsce.transaction_id = t.id
      LEFT JOIN document d ON t.base_document_id = d.id
      WHERE d.project_id IS NOT NULL
    ),
    task_creation_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'ge.date_created',
        project_id: 'p.id',
        user_id: 't.author_user_id',
        base_event_id: 'CAST(t.global_entity_id AS CHAR)',
        event_type: "'Создание задачи'",
        task_id: 't.id'
      })}
      FROM task t
      JOIN global_entity ge ON t.global_entity_id = ge.id
      JOIN project p ON t.target_global_entity_id = p.global_entity_id
      WHERE p.id IS NOT NULL
    ),
    project_direct_operations_source AS (
        -- Управленческие
        SELECT
            ${buildTimelineEventSelect({
              event_date: 'op.period_date',
              project_id: 'w.project_id',
              user_id: '(SELECT u.id FROM user u WHERE u.employee_id = mo.employee_id LIMIT 1)',
              base_event_id: "CONCAT('op_', CAST(op.id AS CHAR))",
              event_type: "'Управленческая операция'",
              operation_id: 'op.id'
            })}
        FROM operation op JOIN management_operation mo ON op.id = mo.id JOIN work w ON mo.work_id = w.id
        WHERE op.type = 'management' AND w.project_id IS NOT NULL
        UNION ALL
        -- Сотрудников
        SELECT
            ${buildTimelineEventSelect({
              event_date: 'op.period_date',
              project_id: 'eo.project_id',
              user_id: '(SELECT u.id FROM user u WHERE u.employee_id = eo.employee_id LIMIT 1)',
              base_event_id: "CONCAT('op_', CAST(op.id AS CHAR))",
              event_type: "'Операция сотрудника'",
              operation_id: 'op.id'
            })}
        FROM operation op JOIN employee_operation eo ON op.id = eo.id
        WHERE op.type = 'employee' AND eo.project_id IS NOT NULL
        UNION ALL
        -- Клиентские
        SELECT
            ${buildTimelineEventSelect({
              event_date: 'op.period_date',
              project_id: 'co.project_id',
              user_id: 'NULL',
              base_event_id: "CONCAT('op_', CAST(op.id AS CHAR))",
              event_type: "'Клиентская операция'",
              operation_id: 'op.id'
            })}
        FROM operation op JOIN client_operation co ON op.id = co.id
        WHERE op.type = 'client' AND co.project_id IS NOT NULL
    ),
    thread_message_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'tm.date_created',
        project_id: 'p.id',
        user_id: 'tm.user_id',
        base_event_id: "CONCAT('msg_', CAST(tm.id AS CHAR))",
        event_type: "'Комментарий'",
        thread_message_id: 'tm.id'
      })}
      FROM thread_message tm
      JOIN global_entity_thread geth ON tm.thread_id = geth.id
      JOIN project p ON geth.global_entity_id = p.global_entity_id
      WHERE p.id IS NOT NULL AND tm.content IS NOT NULL AND TRIM(tm.content) <> ''
    ),
    employee_attach_source AS (
      SELECT
      ${buildTimelineEventSelect({
        event_date: 'e.date_created',
        project_id: 'epae.project_id',
        user_id: 'e.user_id',
        base_event_id: 'CAST(e.id AS CHAR)',
        event_type: "'Назначение сотрудника'",
        employee_id: 'epae.employee_id',
        is_attached_flag: 'epae.is_attached'
      })}
      FROM employee_project_attached_event epae
      JOIN event e ON epae.id = e.id
      WHERE epae.project_id IS NOT NULL
    )
    -- Объединяем все источники
    SELECT
      ${allTimelineColumns.join(', ')}, -- Выбираем все колонки
      p.responsible_user_id as responsibleUserId, -- Текущий ответственный
      -- Подзапрос для определения исторического ответственного на момент события
      (
        SELECT pruce_hist.responsible_user_id
        FROM project_responsible_user_changed_event pruce_hist
        JOIN event e_hist ON pruce_hist.id = e_hist.id
        WHERE pruce_hist.project_id = all_events.project_id
          AND e_hist.date_created <= all_events.event_date
        ORDER BY e_hist.date_created DESC
        LIMIT 1
      ) AS historicalResponsibleUserId
    FROM (
        SELECT * FROM project_creation_source UNION ALL
        SELECT * FROM status_change_source UNION ALL
        SELECT * FROM responsible_change_source UNION ALL
        SELECT * FROM document_creation_source UNION ALL
        SELECT * FROM doc_status_change_source UNION ALL
        SELECT * FROM doc_confirmed_source UNION ALL
        SELECT * FROM doc_shared_source UNION ALL
        SELECT * FROM doc_paid_source UNION ALL
        SELECT * FROM transaction_status_source UNION ALL
        SELECT * FROM task_creation_source UNION ALL
        SELECT * FROM project_direct_operations_source UNION ALL
        SELECT * FROM thread_message_source UNION ALL
        SELECT * FROM employee_attach_source
    ) AS all_events
    JOIN project p ON all_events.project_id = p.id
  `,

  joins: {
    ProjectTimelineProject: {
      relationship: 'belongsTo',
      sql: `${CUBE}.project_id = ${ProjectTimelineProject.id}`,
    },
    ProjectResponsibleUser: {
      relationship: 'belongsTo',
      sql: `${CUBE}.responsibleUserId = ${ProjectResponsibleUser.userId}`
    },
    HistoricalProjectResponsibleUser: {
        relationship: 'belongsTo',
        sql: `${CUBE}.historicalResponsibleUserId = ${HistoricalProjectResponsibleUser.userId}`
    },
    ProjectTimelineProjectStatus: {
      relationship: 'belongsTo',
      sql: `${CUBE}.status_id = ${ProjectTimelineProjectStatus.id}`
    },
    ProjectTimelineAssignedUser: {
      relationship: 'belongsTo',
      sql: `${CUBE}.assigned_user_id = ${ProjectTimelineAssignedUser.userId}`
    },
    ProjectTimelineDocument: {
      relationship: 'belongsTo',
      sql: `${CUBE}.document_id = ${ProjectTimelineDocument.id}`
    },
    ProjectTimelineTransaction: {
      relationship: 'belongsTo',
      sql: `${CUBE}.transaction_id = ${ProjectTimelineTransaction.id}`
    },
    ProjectTimelineTask: {
      relationship: 'belongsTo',
      sql: `${CUBE}.task_id = ${ProjectTimelineTask.id}`
    },
    ProjectTimelineOperation: {
      relationship: 'belongsTo',
      sql: `${CUBE}.operation_id = ${ProjectTimelineOperation.id}`
    },
    ProjectTimelineThreadMessage: {
        relationship: 'belongsTo',
        sql: `${CUBE}.thread_message_id = ${ProjectTimelineThreadMessage.id}`
    },
    ProjectTimelineEventUser: {
        relationship: 'belongsTo',
        sql: `${CUBE}.user_id = ${ProjectTimelineEventUser.userId}`
    },
    ProjectTimelineAttachedEmployee: {
        relationship: 'belongsTo',
        sql: `${CUBE}.employee_id = ${ProjectTimelineAttachedEmployee.id}`
    },
    MultiProjects: {
      relationship: 'belongsTo',
      sql: `${CUBE}.project_id = ${MultiProjects.id}`,
    },
  },

  measures: {
    count: {
      type: 'count',
      title: 'Количество событий',
    },
  },

  dimensions: {
    eventId: {
      sql: 'base_event_id',
      type: 'string',
      primaryKey: true,
      shown: false,
    },
    eventDate: {
      sql: 'event_date',
      type: 'time',
      title: 'Дата и время',
    },
    projectId: {
      sql: 'project_id',
      type: 'number',
      shown: true,
      title: 'ID Проекта (из CUBE)',
    },
    userId: {
      sql: 'user_id',
      type: 'number',
      shown: false,
    },
    eventEmployeeId: {
      sql: `${ProjectTimelineEventUser.id}`,
      type: 'number',
      title: 'ID Сотрудника (событие)',
      shown: true,
    },
    responsibleUserId: {
      sql: 'responsibleUserId',
      type: 'number',
      shown: false,
    },
    historicalResponsibleUserId: {
      sql: 'historicalResponsibleUserId',
      type: 'number',
      shown: false,
    },
    statusId: {
      sql: 'status_id',
      type: 'number',
      shown: false,
    },
    assignedUserId: {
      sql: 'assigned_user_id',
      type: 'number',
      shown: false,
    },
    documentId: {
      sql: 'document_id',
      type: 'number',
      shown: false,
    },
    documentStatusValue: {
      sql: 'document_status',
      type: 'string',
      shown: false,
    },
    isConfirmedFlag: {
      sql: 'is_confirmed_flag',
      type: 'boolean',
      shown: false,
    },
    isSharedFlag: {
      sql: 'is_shared_flag',
      type: 'boolean',
      shown: false,
    },
    isPaidFlag: {
      sql: 'is_paid_flag',
      type: 'boolean',
      shown: false,
    },
    transactionId: {
      sql: 'transaction_id',
      type: 'number',
      shown: false,
    },
    transactionStatusValue: {
      sql: 'transaction_status',
      type: 'string',
      shown: false,
    },
    taskId: {
      sql: 'task_id',
      type: 'number',
      shown: false,
    },
    operationId: {
      sql: 'operation_id',
      type: 'number',
      shown: false,
    },
    threadMessageId: {
      sql: 'thread_message_id',
      type: 'number',
      shown: false,
    },
    attachedEmployeeId: {
      sql: 'employee_id',
      type: 'number',
      shown: false,
    },
    isAttachedFlag: {
      sql: 'is_attached_flag',
      type: 'boolean',
      shown: false,
    },
    responsibilityTypeValue: {
      sql: 'responsible_user_type',
      type: 'string',
      shown: false,
    },

    projectName: {
      sql: `${MultiProjects.name}`,
      type: 'string',
      title: 'Проект',
    },
    responsibleUserInitials: {
      sql: `IFNULL(${ProjectResponsibleUser.initials}, 'Нет отв.')`,
      type: 'string',
      title: 'Ответственный (тек.)',
    },
    historicalResponsibleUserInitials: {
      sql: `IFNULL(${HistoricalProjectResponsibleUser.initials}, 'Нет данных')`,
      type: 'string',
      title: 'Ответственный (истор.)',
    },
    eventUserInitials: {
      sql: `IFNULL(${ProjectTimelineEventUser.initials}, 'Система')`,
      type: 'string',
      title: 'Пользователь (событие)'
    },

    eventType: {
      sql: 'event_type',
      type: 'string',
      title: 'Тип события',
    },
    eventContent: {
      type: 'string',
      title: 'Содержание события',
      case: {
        when: [
          {
            sql: `${CUBE}.event_type = 'Создание проекта'`,
            label: { sql: `CONCAT('Создан проект "', ${ProjectTimelineProject.name}, '"')` },
          },
          {
            sql: `${CUBE}.event_type = 'Изменение статуса проекта'`,
            label: { sql: `CONCAT('Изменен статус проекта на "', ${ProjectTimelineProjectStatus.name}, '" (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Назначение ответственного'`,
            label: {
              sql: `CONCAT(
                'Назначен ',
                CASE ${CUBE}.responsible_user_type
                  WHEN 'responsible_user' THEN 'ответственный за работы'
                  WHEN 'material_responsible_user' THEN 'ответственный за материалы'
                  WHEN 'director_responsible_user' THEN 'директор'
                  ELSE 'ответственный за работы'
                END,
                ': ',
                IFNULL(${ProjectTimelineAssignedUser.initials}, IFNULL(${ProjectTimelineAssignedUser.userName}, 'Неизвестный')),
                ' (Назначил: ',
                ${CUBE.eventUserInitials},
                ')'
              )`
            },
          },
          {
            sql: `${CUBE}.event_type = 'Создание документа'`,
            label: { sql: `CONCAT('Создан документ: ', IFNULL(${ProjectTimelineDocument.nameWithDate}, CONCAT('Документ #', ${CUBE}.document_id)), ' (Автор: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Изменение статуса документа'`,
            label: { sql: `CONCAT('Изменен статус документа ', IFNULL(${ProjectTimelineDocument.nameWithDate}, CONCAT('Документ #', ${CUBE}.document_id)), ' на "', ${ProjectTimelineDocument.statusLabel}, '" (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Подтверждение документа'`,
            label: { sql: `CONCAT(CASE WHEN ${CUBE}.is_confirmed_flag = 1 THEN 'Подтвержден' ELSE 'Отменено подтверждение' END, ' документа: ', IFNULL(${ProjectTimelineDocument.nameWithDate}, CONCAT('Документ #', ${CUBE}.document_id)), ' (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Публикация документа'`,
            label: { sql: `CONCAT(CASE WHEN ${CUBE}.is_shared_flag = 1 THEN 'Опубликован' ELSE 'Отменена публикация' END, ' документа: ', IFNULL(${ProjectTimelineDocument.nameWithDate}, CONCAT('Документ #', ${CUBE}.document_id)), ' (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Оплата документа'`,
            label: { sql: `CONCAT(CASE WHEN ${CUBE}.is_paid_flag = 1 THEN 'Оплачен' ELSE 'Отменена оплата' END, ' документа: ', IFNULL(${ProjectTimelineDocument.nameWithDate}, CONCAT('Документ #', ${CUBE}.document_id)), ' (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Изменение статуса транзакции'`,
            label: { sql: `CONCAT('Изменен статус транзакции на "', ${ProjectTimelineTransaction.transactionStatusLabel}, '" (сумма: ', ${ProjectTimelineTransaction.sum}, ') (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Создание задачи'`,
            label: { sql: `CONCAT('Создана задача: ', IFNULL(${ProjectTimelineTask.name}, CONCAT('Задача #', ${CUBE}.task_id)), ' (Автор: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Управленческая операция'`,
            label: { sql: `CONCAT('Операция: ', IFNULL(${ProjectTimelineOperation.description}, ''), ' (сумма: ', ${ProjectTimelineOperation.sum}, ') (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Операция сотрудника'`,
            label: { sql: `CONCAT('Операция: ', IFNULL(${ProjectTimelineOperation.description}, ''), ' (сумма: ', ${ProjectTimelineOperation.sum}, ') (Пользователь: ', ${CUBE.eventUserInitials}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Клиентская операция'`,
            label: { sql: `CONCAT('Операция: ', IFNULL(${ProjectTimelineOperation.description}, ''), ' (сумма: ', ${ProjectTimelineOperation.sum}, ')')` },
          },
          {
            sql: `${CUBE}.event_type = 'Комментарий'`,
            label: { sql: `CONCAT(${CUBE.eventUserInitials}, ': ', ${ProjectTimelineThreadMessage.content})` },
          },
          {
            sql: `${CUBE}.event_type = 'Назначение сотрудника'`,
            label: {
              sql: `CONCAT(
                CASE WHEN ${CUBE}.is_attached_flag = 1 THEN 'Назначен сотрудник: ' ELSE 'Откреплен сотрудник: ' END,
                IFNULL(${ProjectTimelineAttachedEmployee.initials}, CONCAT('Сотрудник #', ${CUBE}.employee_id)),
                ' (Пользователь: ',
                ${CUBE.eventUserInitials},
                ')'
              )`
            },
          },
        ],
        else: { label: { sql: `${CUBE}.event_type` } },
      },
    },
  },
  
    dataSource: 'default',
});
