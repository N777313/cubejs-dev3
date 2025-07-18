cube(`UserActivities`, {
  sql: `
    -- Запрос Сообщения
    SELECT
        CONCAT('message_', tm.id) AS "action_record_id",
        u.name AS "employee_nickname",
        CONCAT(COALESCE(np_employee.second_name, ''), ' ', SUBSTRING(COALESCE(np_employee.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(np_employee.patronymic, ''), 1, 1), '.') AS "employee_name",
        e.id AS "employee_id",
        p_thread.name AS "project_name",
        'Сообщение' AS "action_type",
        CONCAT(
            'Текст: ', tm.content,
            CASE
                WHEN np_counterparty.second_name IS NOT NULL THEN CONCAT('; Кому: ', CONCAT(COALESCE(np_counterparty.second_name, ''), ' ', SUBSTRING(COALESCE(np_counterparty.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(np_counterparty.patronymic, ''), 1, 1), '.'))
                ELSE ''
            END,
            CASE
                WHEN a.type IS NOT NULL THEN
                    CASE a.type
                        WHEN 'file' THEN ' (Прикреплен файл)'
                        WHEN 'image' THEN ' (Прикреплена картинка)'
                        ELSE CONCAT(' (', a.type, ')') -- На случай, если появятся новые типы
                    END
                ELSE ''
            END
        ) AS "action_content",
        tm.date_created AS "date_created"
    FROM user AS u
    JOIN thread_message AS tm ON u.id = tm.user_id
    LEFT JOIN employees AS e ON e.id = u.employee_id
    LEFT JOIN natural_person AS np_employee ON np_employee.id = e.id
    LEFT JOIN thread AS t ON tm.thread_id = t.id
    LEFT JOIN global_entity_thread AS geth ON t.id = geth.id
    LEFT JOIN global_entity AS ge ON geth.global_entity_id = ge.id
    LEFT JOIN counterparty AS c ON ge.id = c.global_entity_id
    LEFT JOIN natural_person AS np_counterparty ON c.id = np_counterparty.id
    LEFT JOIN project AS p_thread ON ge.id = p_thread.global_entity_id
    LEFT JOIN attachment AS a ON tm.id = a.thread_message_id

    UNION ALL

    -- Запрос Реакции
    SELECT
        CONCAT('reaction_', tmr.id) AS "action_record_id",
        u.name AS "employee_nickname",
        CONCAT(COALESCE(np_employee.second_name, ''), ' ', SUBSTRING(COALESCE(np_employee.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(np_employee.patronymic, ''), 1, 1), '.') AS "employee_name",
        e.id AS "employee_id",
        p_thread.name AS "project_name",
        'Реакция' AS "action_type",
        CONCAT(
            CASE tmr.type
                WHEN 'like' THEN 'Лайк'
                WHEN 'dislike' THEN 'Дизлайк'
                WHEN 'smile' THEN 'Улыбка'
                WHEN 'angry' THEN 'Недовольство'
                WHEN 'party' THEN 'Вечеринка'
                WHEN 'beer' THEN 'Пиво'
                WHEN 'sad' THEN 'Грусть'
                WHEN 'eye' THEN 'Взгляд'
                ELSE tmr.type
            END,
            CASE WHEN np_counterparty.second_name IS NOT NULL THEN CONCAT(', Кому: ', CONCAT(COALESCE(np_counterparty.second_name, ''), ' ', SUBSTRING(COALESCE(np_counterparty.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(np_counterparty.patronymic, ''), 1, 1), '.')) ELSE '' END
        ) AS "action_content",
        tm.date_created AS "date_created"
    FROM user AS u
    JOIN thread_message_reaction AS tmr ON u.id = tmr.user_id
    JOIN thread_message AS tm ON tm.id = tmr.message_id
    LEFT JOIN employees AS e ON e.id = u.employee_id
    LEFT JOIN natural_person AS np_employee ON np_employee.id = e.id
    LEFT JOIN thread AS t ON tm.thread_id = t.id
    LEFT JOIN global_entity_thread AS geth ON t.id = geth.id
    LEFT JOIN global_entity AS ge ON geth.global_entity_id = ge.id
    LEFT JOIN counterparty AS c ON ge.id = c.global_entity_id
    LEFT JOIN natural_person AS np_counterparty ON c.id = np_counterparty.id
    LEFT JOIN project AS p_thread ON ge.id = p_thread.global_entity_id

    UNION ALL

    -- Запрос Изменения статуса трансакции
    SELECT
        CONCAT('event_', event.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natural_person.second_name, ''), ' ', SUBSTRING(COALESCE(natural_person.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natural_person.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        CASE
            WHEN event.type = 'transaction_status_changed_event' THEN 'Изменение статуса транзакции'
            ELSE event.type
        END AS "action_type",
        CONCAT(
            'Статус: ',
            CASE transaction_status_changed_event.transaction_status
                WHEN 'draft' THEN 'Черновик'
                WHEN 'planned' THEN 'Запланировано'
                WHEN 'rejected' THEN 'Отклонено'
                WHEN 'postponed' THEN 'Отложено'
                WHEN 'confirmed' THEN 'Подтверждено'
                ELSE COALESCE(transaction_status_changed_event.transaction_status, '')
            END,
            '; ',
            'Сумма: ', COALESCE(CAST(transaction.sum AS CHAR), '0'), '; ',
            'Док: ',
            CASE doc2.type
                WHEN 'transaction' THEN 'Перевод'
                WHEN 'estimate' THEN 'Смета'
                WHEN 'works_contract' THEN 'Договор на выполнение работ'
                WHEN 'act' THEN 'Акт'
                WHEN 'design_contract' THEN 'Договор на дизайн'
                WHEN 'materials_contract' THEN 'Договор на материалы'
                WHEN 'materials_contract_agreement' THEN 'Поручение на закупку материалов'
                WHEN 'disclaimer_contract_agreement' THEN 'Уведомление об отмене гарантии'
                WHEN 'handover_contract_agreement' THEN 'Акт приема передачи'
                WHEN 'materials_invoice' THEN 'Счет на материалы'
                WHEN 'termination_contract_agreement' THEN 'Соглашение о расторжении договора'
                WHEN 'adjustment' THEN 'Корректировка'
                WHEN 'transaction_bonus_adjustment' THEN 'Корректировка премии'
                WHEN 'control_measurement_act_contract_agreement' THEN 'Акт контрольного обмера'
                WHEN 'period_extension_contract_agreement' THEN 'Доп. соглашение об изменении срока выполнения работ'
                WHEN 'transaction_adjustment' THEN 'Корректировка с зарплаты'
                WHEN 'discount_contract_agreement' THEN 'Доп. соглашение о предоставлении скидки'
                WHEN 'expenses_invoice' THEN 'Счет на расходы'
                WHEN 'non_payment_contract_agreement' THEN 'Требование об оплате выполненных работ'
                WHEN 'project_return_contract_agreement' THEN 'Акт возврата объекта'
                WHEN 'repudiation_contract_agreement' THEN 'Уведомление об отказе от исполнения обязательств'
                WHEN 'idle_notification_contract_agreement' THEN 'Уведомлении о простое'
                WHEN 'amend_contract_agreement' THEN 'Доп. соглашение об изменении условий договора'
                WHEN 'work_volume_changes_contract_agreement' THEN 'Доп. соглашение изменения объема работ'
                WHEN 'idle_act_contract_agreement' THEN 'Акт простоя'
                WHEN 'credit_contract_agreement' THEN 'Доп. сограшение об оплате заемными средствами'
                WHEN 'suppliers_materials_contract' THEN 'Договор на поставку материалов от поставщиков'
                ELSE COALESCE(doc2.type, '')
            END,
            '; ',
            'Коммент: ', COALESCE(doc1.description, '')
        ) AS "action_content",
        event.date_created AS "date_created"
    FROM user
    JOIN event ON user.id = event.user_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person ON natural_person.id = employees.id
    LEFT JOIN transaction_status_changed_event ON event.id = transaction_status_changed_event.id
    LEFT JOIN transaction ON transaction_status_changed_event.transaction_id = transaction.id
    LEFT JOIN document AS doc1 ON transaction.id = doc1.id
    LEFT JOIN document AS doc2 ON transaction.base_document_id = doc2.id
    LEFT JOIN project ON doc1.project_id = project.id
    WHERE event.type = 'transaction_status_changed_event'

    UNION ALL

    -- Запрос Создание проекта
    SELECT
        CONCAT('event_', event.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natural_person.second_name, ''), ' ', SUBSTRING(COALESCE(natural_person.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natural_person.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        CASE
            WHEN event.type = 'project_created_event' THEN 'Создание проекта'
            ELSE event.type
        END AS "action_type",
        CONCAT('Сумма: ', COALESCE(CAST(project.sum AS CHAR), '')) AS "action_content",
        event.date_created AS "date_created"
    FROM user
    JOIN event ON user.id = event.user_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person ON natural_person.id = employees.id
    LEFT JOIN project_created_event ON project_created_event.id = event.id
    LEFT JOIN project ON project_created_event.project_id = project.id
    WHERE event.type = 'project_created_event'

    UNION ALL

    -- Запрос Создание документа
    SELECT
        CONCAT('event_', event.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natural_person.second_name, ''), ' ', SUBSTRING(COALESCE(natural_person.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natural_person.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        'Создание документа' AS "action_type",
        CONCAT(
            CASE document.type
                WHEN 'transaction' THEN 'Перевод'
                WHEN 'estimate' THEN 'Смета'
                WHEN 'works_contract' THEN 'Договор на выполнение работ'
                WHEN 'act' THEN 'Акт'
                WHEN 'design_contract' THEN 'Договор на дизайн'
                WHEN 'materials_contract' THEN 'Договор на материалы'
                WHEN 'materials_contract_agreement' THEN 'Поручение на закупку материалов'
                WHEN 'disclaimer_contract_agreement' THEN 'Уведомление об отмене гарантии'
                WHEN 'handover_contract_agreement' THEN 'Акт приема передачи'
                WHEN 'materials_invoice' THEN 'Счет на материалы'
                WHEN 'termination_contract_agreement' THEN 'Соглашение о расторжении договора'
                WHEN 'adjustment' THEN 'Корректировка'
                WHEN 'transaction_bonus_adjustment' THEN 'Корректировка премии'
                WHEN 'control_measurement_act_contract_agreement' THEN 'Акт контрольного обмера'
                WHEN 'period_extension_contract_agreement' THEN 'Доп. соглашение об изменении срока выполнения работ'
                WHEN 'transaction_adjustment' THEN 'Корректировка с зарплаты'
                WHEN 'discount_contract_agreement' THEN 'Доп. соглашение о предоставлении скидки'
                WHEN 'expenses_invoice' THEN 'Счет на расходы'
                WHEN 'non_payment_contract_agreement' THEN 'Требование об оплате выполненных работ'
                WHEN 'project_return_contract_agreement' THEN 'Акт возврата объекта'
                WHEN 'repudiation_contract_agreement' THEN 'Уведомление об отказе от исполнения обязательств'
                WHEN 'idle_notification_contract_agreement' THEN 'Уведомлении о простое'
                WHEN 'amend_contract_agreement' THEN 'Доп. соглашение об изменении условий договора'
                WHEN 'work_volume_changes_contract_agreement' THEN 'Доп. соглашение изменения объема работ'
                WHEN 'idle_act_contract_agreement' THEN 'Акт простоя'
                WHEN 'credit_contract_agreement' THEN 'Доп. соглашение об оплате заемными средствами'
                WHEN 'suppliers_materials_contract' THEN 'Договор на поставку материалов от поставщиков'
                ELSE COALESCE(document.type, '')
            END,
            '; Статус: ',
            CASE document.document_status
                WHEN 'draft' THEN 'Черновик'
                WHEN 'planning' THEN 'Планируется'
                WHEN 'sent' THEN 'Отправлен'
                WHEN 'signed' THEN 'Подписан'
                WHEN 'confirmed' THEN 'Подтвержден'
                ELSE COALESCE(document.document_status, '')
            END,
            '; Коммент: ', COALESCE(document.description, '')
        ) AS "action_content",
        event.date_created AS "date_created"
    FROM user
    JOIN event ON user.id = event.user_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person ON natural_person.id = employees.id
    LEFT JOIN document_created_event ON event.id = document_created_event.id
    LEFT JOIN document ON document_created_event.document_id = document.id
    LEFT JOIN project ON document.project_id = project.id
    WHERE event.type = 'document_created_event'

    UNION ALL

    -- Запрос создания кондидата
    SELECT
        CONCAT('event_', event.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natur1.second_name, ''), ' ', SUBSTRING(COALESCE(natur1.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natur1.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        CASE
            WHEN event.type = 'candidate_created_event' THEN 'Создание кандидата'
            ELSE event.type
        END AS "action_type",
        CONCAT(
            'Кандидат: ',
            CONCAT(COALESCE(natur2.second_name, ''), ' ', SUBSTRING(COALESCE(natur2.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natur2.patronymic, ''), 1, 1), '.')
        ) AS "action_content",
        event.date_created AS "date_created"
    FROM user
    JOIN event ON user.id = event.user_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person AS natur1 ON natur1.id = employees.id
    LEFT JOIN candidate_created_event ON candidate_created_event.id = event.id
    LEFT JOIN candidate ON candidate_created_event.candidate_id = candidate.id
    LEFT JOIN natural_person AS natur2 ON candidate.id = natur2.id
    LEFT JOIN counterparty ON natur2.id = counterparty.id
    LEFT JOIN project ON counterparty.id = project.client_id
    WHERE event.type = 'candidate_created_event'

    UNION ALL

    -- Запрос на Версия документа
    SELECT
        CONCAT('document_snapshot_', document_snapshot.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natural_person.second_name, ''), ' ', SUBSTRING(COALESCE(natural_person.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natural_person.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        'Версия документа' AS "action_type",
        CONCAT(
            document.name,
            '; Статус: ',
            CASE document.document_status
                WHEN 'draft' THEN 'черновик'
                WHEN 'confirmed' THEN 'подтверждено'
                WHEN 'sent' THEN 'отправлено'
                WHEN 'planning' THEN 'планирование'
                WHEN 'signed' THEN 'подписано'
                ELSE document.document_status
            END,
            '; Сумма: ', CAST(document_snapshot.document_sum AS CHAR),
            CASE
                WHEN document.description IS NOT NULL AND document.description != '' THEN CONCAT('; Коменты: ', document.description)
                ELSE ''
            END
        ) AS "action_content",
        document_snapshot.date_created AS "date_created"
    FROM user
    JOIN document_snapshot ON user.id = document_snapshot.user_id
    JOIN document ON document.id = document_snapshot.document_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person ON natural_person.id = employees.id
    LEFT JOIN project ON document.project_id = project.id

    UNION ALL

    -- Запрос на Задание
    SELECT
        CONCAT('task_', task.id) AS "action_record_id",
        user.name AS "employee_nickname",
        CONCAT(COALESCE(natural_person.second_name, ''), ' ', SUBSTRING(COALESCE(natural_person.name, ''), 1, 1), '.', ' ', SUBSTRING(COALESCE(natural_person.patronymic, ''), 1, 1), '.') AS "employee_name",
        employees.id AS "employee_id",
        project.name AS "project_name",
        'Задание' AS "action_type",
        CONCAT_WS('; ',
            task.name,
            CASE WHEN task.description IS NOT NULL AND task.description != '' THEN CONCAT('Коммент: ', task.description) ELSE NULL END,
            CONCAT('Статус: ',
                CASE task.status
                    WHEN 'failed' THEN 'Неуспешный'
                    WHEN 'pending' THEN 'В ожидании'
                    WHEN 'success' THEN 'Успешный'
                    ELSE task.status
                END
            ),
            CONCAT('Приоритет: ',
                CASE task.priority
                    WHEN 'high' THEN 'Высокий'
                    WHEN 'highest' THEN 'Наивысший'
                    WHEN 'medium' THEN 'Средний'
                    ELSE task.priority
                END
            ),
            CASE WHEN document.name IS NOT NULL AND document.name != '' THEN CONCAT('Документ: ', document.name) ELSE NULL END,
            CASE WHEN document.description IS NOT NULL AND document.description != '' THEN CONCAT('Тема: ', document.description) ELSE NULL END,
            CASE WHEN document.date_created IS NOT NULL THEN CONCAT('От: ', document.date_created) ELSE NULL END,
            CASE WHEN task.result IS NOT NULL AND task.result != '' THEN CONCAT('Результат: ', task.result) ELSE NULL END
        ) AS "action_content",
        global_entity.date_created AS "date_created"
    FROM user
    JOIN task ON user.id = task.user_id
    LEFT JOIN employees ON employees.id = user.employee_id
    LEFT JOIN natural_person ON natural_person.id = employees.id
    LEFT JOIN document ON task.document_id = document.id
    LEFT JOIN global_entity ON task.global_entity_id = global_entity.id
    LEFT JOIN project ON task.target_global_entity_id = project.global_entity_id
  `,

  measures: {
    count: {
      type: `count`,
      description: `Общее количество действий`,
      drillMembers: [
        `employee_nickname`,
        `project_name`,
        `action_type`,
        `action_content`,
        `date_created`
      ]
    }
  },

  dimensions: {
    action_record_id: {
      sql: `action_record_id`,
      type: `string`,
      primaryKey: true,
      title: `ID Записи Действия`
    },

    employee_nickname: {
      sql: `employee_nickname`,
      type: `string`,
      title: `Ник сотрудника`
    },

    employee_name: {
      sql: `employee_name`,
      type: `string`,
      title: `Имя сотрудника`
    },

    employee_id: {
      sql: `employee_id`,
      type: `number`,
      title: `ID сотрудника`
    },

    project_name: {
      sql: `project_name`,
      type: `string`,
      title: `Название проекта`
    },

    action_type: {
      sql: `action_type`,
      type: `string`,
      title: `Тип действия`
    },

    action_content: {
      sql: `action_content`,
      type: `string`,
      title: `Содержание действия`
    },

    date_created: {
      sql: `date_created`,
      type: `time`,
      title: `Дата создания`
    }
  },

  joins: {
    Employees: {
      sql: `${CUBE}.employee_id = ${Employees}.id`,
      relationship: `belongsTo`
    }
  }
});