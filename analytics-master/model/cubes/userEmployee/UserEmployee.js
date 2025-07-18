cube(`UserEmployee`, {
  extends: Employees,

  sql: `
  SELECT e.*, u.id user_id, u.name user_name FROM user u
  LEFT JOIN (${Employees.sql()}) e ON e.id = u.employee_id 
  `,

  dimensions: {
    userName: {
      sql: `user_name`,
      type: `string`
    },
    userId: {
      sql: `user_id`,
      type: `number`
    }
  }
});
