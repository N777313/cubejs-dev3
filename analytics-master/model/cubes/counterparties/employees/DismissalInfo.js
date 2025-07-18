cube(`DismissalInfo`, {
  sql: `
    SELECT
        id,
        dismissal_date,
        description,
        employee_id 
    FROM dismissal_info`,
  
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    Employees: {
      sql: `${CUBE.employeeId} = ${Employees.id}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, dismissalDate]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    description: {
      sql: `description`,
      type: `string`
    },
    
    dismissalDate: {
      sql: `dismissal_date`,
      type: `time`
    },

    employeeId: {
      sql: `employee_id`,
      type: `number`
    }
  },
  
  dataSource: `default`
});
