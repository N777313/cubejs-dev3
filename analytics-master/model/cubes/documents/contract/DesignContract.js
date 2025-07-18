cube(`DesignContract`, {
  sql: `SELECT * FROM design_contract`,
  
  title: "Договор на дизайн",
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: "Кол-во",
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: "Номер",
    }
  },
  
  dataSource: `default`
});
