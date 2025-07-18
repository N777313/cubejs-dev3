cube(`WorkQuality`, {
  sql: `SELECT * FROM work_quality`,
  
  joins: {
     Works: {
       sql: `${CUBE}.work_id = ${Works}.id`,
       relationship: `hasOne`
     }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    status: {
      sql: `status`,
      type: `string`
    },
    
    description: {
      sql: `description`,
      type: `string`
    }
  },
  
  dataSource: `default`
});
