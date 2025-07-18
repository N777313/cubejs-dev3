cube(`ActActivity`, {
  sql: `
    SELECT
        DATE_FORMAT(d.date_created, '%Y-%m-%d') AS report_date,
        a.responsible_employee_id AS employee_id,
        d.id AS document_id,
        d.project_id AS project_id
    FROM
        document d
        JOIN act a ON d.id = a.id
    WHERE
        d.type = 'act'
        AND d.is_deleted = 0
        AND a.responsible_employee_id IS NOT NULL
        AND d.is_confirmed = 1
        AND d.is_paid = 1
     `,

  title: "Активность: Создание подтвержденного и оплаченного акта",

  dimensions: {
     report_date: {
       sql: `report_date`,
       type: `time`,
       title: "Дата создания акта"
     },
     employee_id: {
       sql: `employee_id`,
       type: `number`,
       title: "ID ответственного сотрудника"
     },
     document_id: {
       sql: `document_id`,
       type: `number`,
       title: "ID Документа (Акта)"
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
      title: "Количество подтвержденных и оплаченных актов"
    }
  }
});
