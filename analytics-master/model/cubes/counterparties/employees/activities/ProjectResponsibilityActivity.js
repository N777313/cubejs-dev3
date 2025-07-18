cube(`ProjectResponsibilityActivity`, {
  sql: `
    SELECT
        DATE_FORMAT(ev.date_created, '%Y-%m-%d') AS report_date,
        u.employee_id,
        pruce.project_id AS project_id,
        pruce.responsible_user_type
    FROM
        project_responsible_user_changed_event pruce
        JOIN event ev ON pruce.id = ev.id
        JOIN user u ON pruce.responsible_user_id = u.id
    WHERE
        u.employee_id IS NOT NULL
  `,

  title: "Активность: Назначение ответственным за проект",

  dimensions: {
     report_date: {
       sql: `report_date`,
       type: `time`,
       title: "Дата назначения/смены"
     },
     employee_id: {
       sql: `employee_id`,
       type: `number`,
       title: "ID сотрудника (ответственного)"
     },
     project_id: {
       sql: `project_id`,
       type: `number`,
       title: "ID Проекта"
     },
     responsibilityType: {
       sql: `responsible_user_type`,
       type: `string`,
       title: "Тип ответственности"
     }
  },

  measures: {
    count: {
      type: `count`,
      title: "Количество назначений/смен"
    }
  }
});
