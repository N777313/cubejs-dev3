cube(`SalaryVersion`, {
  sql: `
    SELECT 
      id,
      salary_date,
      employee_id,
      author_user_id,
      description,
      position_id,
      ROW_NUMBER() over (
        PARTITION BY employee_id
        ORDER BY salary_date DESC
      ) desc_order_employee_date
    FROM salary_version
  `,

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    salaryDate: {
      sql: `salary_date`,
      type: `time`
    },

    descOrderEmployeeDate: {
      sql: `desc_order_employee_date`,
      type: `number`
    },

    employeeId: {
      sql: `employee_id`,
      type: `number`
    },

    authorUserId: {
      sql: `author_user_id`,
      type: `number`
    },

    description: {
      sql: `description`,
      type: `string`
    },

    positionId: {
      sql: `position_id`,
      type: `number`
    }
  }

})