cube(`ProjectStatusGroup`, {
  sql: `
    SELECT sg.* 
    FROM ${StatusGroup.sql()} sg
    WHERE sg.type = 'project'
    `,
  
  extends: StatusGroup,
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },
  }
});
