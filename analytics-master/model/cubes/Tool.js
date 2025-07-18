cube(`Tool`, {
  sql: `SELECT * FROM yar.tool`,
  
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    },
    costSum: {
      type: `sum`,
      sql: `cost`
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    name: {
      sql: `name`,
      type: `string`
    },
    
    cost: {
      sql: `cost`,
      type: `string`
    },
    
    description: {
      sql: `description`,
      type: `string`
    }
  },
  
  dataSource: `default`
});
