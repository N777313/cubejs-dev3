cube(`ResponsibleUserAnalytics`, {
  sql: `
    SELECT
      u.id as responsible_id,
      u.name as user_name,
      CONCAT(
        IFNULL(np.second_name, ''), ' ',
        IFNULL(np.name, ''), ' ',
        IFNULL(np.patronymic, '')
      ) as full_name,
      p.id as project_id,
      ps.id as status_id,
      s.name as stage_name,
      sg.name as status_group_name,
      a.id as act_id,
      a.sum as act_sum,
      d.document_date,
      d.is_confirmed
    FROM user u
    LEFT JOIN employees e ON u.employee_id = e.id
    LEFT JOIN natural_person np ON e.id = np.id
    LEFT JOIN project p ON u.id = p.responsible_user_id
    LEFT JOIN project_status ps ON p.project_status_id = ps.id
    LEFT JOIN status s ON ps.id = s.id
    LEFT JOIN status_group sg ON s.status_group_id = sg.id
    LEFT JOIN document d ON p.id = d.project_id
                       AND d.type = 'act'
                       AND d.is_confirmed = 1
    LEFT JOIN act a ON d.id = a.id
  `,
  
  joins: {
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE}.project_id = ${MultiProjects.id}`
    }
  },
  
  measures: {
    // Количество подтвержденных актов выполненных работ
    actsCount: {
      type: `countDistinct`,
      sql: `act_id`,
      title: `Количество подтвержденных актов`
    },
    
    // Сумма подтвержденных актов выполненных работ
    actsSum: {
      type: `sum`,
      sql: `act_sum`,
      title: `Сумма подтвержденных актов`,
      format: `number`
    },
    
    // Средняя сумма подтвержденного акта
    avgActSum: {
      type: `number`,
      sql: `CASE WHEN ${CUBE.actsCount} > 0 THEN ${CUBE.actsSum} / ${CUBE.actsCount} ELSE 0 END`,
      title: `Средняя сумма подтвержденного акта`,
      format: `number`
    },
    
    // Количество проектов с подтвержденными актами (любой статус)
    projectsWithActsCount: {
      type: `countDistinct`,
      sql: `project_id`,
      title: `Проектов с подтвержденными актами`,
      filters: [
        { sql: `act_id IS NOT NULL` }
      ]
    },
    
    // Общее количество проектов у пользователя
    totalProjectsCount: {
      type: `countDistinct`,
      sql: `project_id`,
      title: `Всего проектов`
    },
    
    // Количество проектов в работе (группа статусов 'Выполнение работ')
    inWorkProjectsCount: {
      type: `countDistinct`,
      sql: `project_id`,
      title: `Проектов в работе`,
      filters: [
        { sql: `${CUBE.statusGroupName} = 'Выполнение работ'` }
      ]
    },
    
    // Количество проектов В РАБОТЕ (группа 'Выполнение работ') с подтвержденными актами
    projectsWithActsInWorkCount: {
      type: `countDistinct`,
      sql: `project_id`,
      title: `Проектов в работе с актами`,
      filters: [
        { sql: `act_id IS NOT NULL` },
        { sql: `${CUBE.statusGroupName} = 'Выполнение работ'` }
      ]
    },
    
    // Количество проектов В РАБОТЕ (группа 'Выполнение работ') без подтвержденных актов
    projectsWithoutActsCount: {
      type: `number`,
      sql: `GREATEST(0, ${CUBE.inWorkProjectsCount} - ${CUBE.projectsWithActsInWorkCount})`,
      title: `Проектов в работе без актов`
    },
    
    // Процент проектов В РАБОТЕ без актов
    projectsWithoutActsPercent: {
      type: `number`,
      sql: `
        CASE 
          WHEN ${CUBE.inWorkProjectsCount} > 0 
          THEN GREATEST(0, ${CUBE.projectsWithoutActsCount}) * 100.0 / ${CUBE.inWorkProjectsCount}
          ELSE 0 
        END
      `,
      title: `Процент проектов без актов (от проектов в работе)`,
      format: `percent`
    },
    
    // Процент участия в доходе
    revenueParticipationPercent: {
      type: `number`,
      sql: `
        CASE
          WHEN (
            SELECT SUM(a_sub.sum)
            FROM act a_sub
            JOIN document d_sub ON a_sub.id = d_sub.id
            WHERE d_sub.type = 'act' AND d_sub.is_confirmed = 1
          ) > 0
          THEN ${CUBE.actsSum} * 100.0 / (
            SELECT SUM(a_sub.sum)
            FROM act a_sub
            JOIN document d_sub ON a_sub.id = d_sub.id
            WHERE d_sub.type = 'act' AND d_sub.is_confirmed = 1
          )
          ELSE 0
        END
      `,
      title: `Процент участия в доходе`,
      format: `percent`
    }
  },
  
  dimensions: {
    responsibleId: {
      sql: `responsible_id`,
      type: `number`,
      primaryKey: true,
      title: `ID ответственного`
    },
    
    responsibleName: {
      sql: `CASE 
        WHEN TRIM(full_name) != '' THEN full_name 
        ELSE user_name 
      END`,
      type: `string`,
      title: `Ответственный`
    },
    
    statusId: {
      sql: `status_id`,
      type: `number`,
      title: `ID статуса проекта`
    },
    
    statusGroupName: {
      sql: `status_group_name`,
      type: `string`,
      title: `Группа статусов проекта`
    },
    
    stageName: {
      sql: `stage_name`,
      type: `string`,
      title: `Этап воронки`
    },
    
    // Дата документа (акта). Будет NULL для проектов без подтвержденных актов
    documentDate: {
      sql: `document_date`,
      type: `time`,
      title: `Дата акта`
    },
    
    // Неделя (основана на дате акта)
    week: {
      sql: `YEARWEEK(document_date, 1)`,
      type: `time`,
      title: `Неделя`
    },
    
    // Месяц (основан на дате акта)
    month: {
      sql: `DATE_FORMAT(document_date, '%Y-%m-01')`,
      type: `time`,
      title: `Месяц`
    },
    
    // Квартал (основан на дате акта)
    quarter: {
      sql: `CONCAT(YEAR(document_date), '-Q', QUARTER(document_date))`,
      type: `string`,
      title: `Квартал`
    },
    
    // Год (основан на дате акта)
    year: {
      sql: `YEAR(document_date)`,
      type: `number`,
      title: `Год`
    }
  }
}); 