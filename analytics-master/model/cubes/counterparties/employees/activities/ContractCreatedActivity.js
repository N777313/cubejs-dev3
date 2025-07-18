cube(`ContractCreatedActivity`, {
  sql: `
    SELECT
        DATE_FORMAT(d.date_created, '%Y-%m-%d') AS report_date, 
        u.employee_id, 
        d.id AS document_id, 
        ev.id AS event_id,
        d.project_id AS project_id
    FROM
        document d
        JOIN document_created_event dce ON d.id = dce.document_id
        JOIN event ev ON dce.id = ev.id 
        JOIN user u ON ev.user_id = u.id 
    WHERE
        d.type IN ('works_contract', 'design_contract') 
        AND d.is_deleted = 0 
        AND u.employee_id IS NOT NULL 
      `,

  title: "Активность: Создание договора",

  dimensions: {
     report_date: {
       sql: `report_date`,
       type: `time`,
       title: "Дата создания договора"
     },
     employee_id: {
       sql: `employee_id`,
       type: `number`,
       title: "ID сотрудника (создателя)"
     },
     document_id: {
       sql: `document_id`,
       type: `number`,
       title: "ID Документа (Договора)"
     },
     event_id: {
       sql: `event_id`,
       type: `string`, 
       title: "ID События создания"
     },
     projectId: {
       sql: `project_id`,
       type: `number`,
       title: "ID Проекта"
     }
  },

  measures: {
    count: {
      type: `count`,
      title: "Количество созданных договоров"
    }
  }
  
});
