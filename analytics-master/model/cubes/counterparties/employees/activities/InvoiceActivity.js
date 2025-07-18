cube(`InvoiceActivity`, {
  sql: `
    SELECT
        DATE_FORMAT(d.date_created, '%Y-%m-%d') AS report_date, 
        u.employee_id AS employee_id,
        d.id AS document_id,
        d.project_id AS project_id
    FROM
        document d
    JOIN (
        SELECT 
            document_id,
            MIN(date) as first_date,
            MIN(id) as first_id
        FROM 
            document_history
        GROUP BY 
            document_id
    ) dh_min ON d.id = dh_min.document_id
    JOIN
        document_history dh ON dh.id = dh_min.first_id
    JOIN 
        user u ON dh.user_id = u.id
    WHERE
        d.type = 'materials_invoice' 
        AND d.is_deleted = 0 
        AND u.employee_id IS NOT NULL
     `,

  joins: {
    Employees: {
      relationship: `belongsTo`,
      sql: `${CUBE}.employee_id = ${Employees.id}`
    }
  },

  title: "Активность: Создание накладной (по создателю документа)",

  dimensions: {
     report_date: {
       sql: `report_date`,
       type: `time`,
       title: "Дата создания накладной"
     },
     employee_id: {
       sql: `employee_id`,
       type: `number`,
       title: "ID сотрудника (Создатель накладной)"
     },
     document_id: {
       sql: `document_id`,
       type: `number`,
       primaryKey: true,
       shown: false,
       title: "ID Документа (Накладной)"
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
      title: "Количество созданных накладных"
    }
  }
});
