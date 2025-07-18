cube(`Client`, {
  extends: Counterparty,

  joins: {
    MultiProjects: {
      relationship:  `hasMany`,
      sql: `${CUBE.id} = ${MultiProjects.clientId}`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, secondName, passportDate]
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
