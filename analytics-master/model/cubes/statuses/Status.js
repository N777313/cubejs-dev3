cube(`Status`, {
  sql: `
    SELECT 
        id,
        type,
        name,
        'order',
        status_group_id,
        status_type
    FROM status`,
  
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

    statusType: {
      sql: `status_type`,
      type: `string`
    },

    order: {
      sql: `order`,
      type: `number`
    },

    statusGroupId: {
      sql: `status_group_id`,
      type: `number`
    }

  },
  
  dataSource: `default`
});
