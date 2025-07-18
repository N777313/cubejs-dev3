cube(`EstimateActivity`, {
  sql: `
    SELECT
        DATE_FORMAT(d.date_created, '%Y-%m-%d') AS report_date, 
        e.responsible_employee_id AS employee_id, 
        d.id AS document_id,
        d.project_id AS project_id
    FROM
        document d
        JOIN estimate e ON d.id = e.id
    WHERE
        d.type = 'estimate' 
        AND d.is_deleted = 0 
        AND e.responsible_employee_id IS NOT NULL 
      `,

  title: "Активность: Создание сметы",

  dimensions: {
     report_date: {
       sql: `report_date`,
       type: `time`,
       title: "Дата создания сметы"
     },
     employee_id: {
       sql: `employee_id`,
       type: `number`,
       title: "ID ответственного сотрудника"
     },
     document_id: {
       sql: `document_id`,
       type: `number`,
       title: "ID Документа (Сметы)"
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
      title: "Количество созданных смет"
    }
  }
}); 