cube(`User`, {
  sql: `SELECT * FROM user`,
  
  joins: {
    UserEmployee: {
      relationship: `hasOne`,
      sql: `${CUBE.employeeId} = ${UserEmployee.id}`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    }
  },
  
  dimensions: {
    email: {
      sql: `email`,
      type: `string`
    },
    
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
    },
    
    name: {
      sql: `name`,
      type: `string`
    },

    employeeId: {
      sql: `employee_id`,
      type: `number`
    }
  }
});
