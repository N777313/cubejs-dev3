cube(`GlobalEntityThread`, {
  extends: Thread,
  sql: `
    SELECT 
        t.*, 
        gethread.global_entity_id 
    FROM global_entity_thread gethread
    LEFT JOIN ${Thread.sql()} t ON t.id = gethread.id
  `,

  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    GlobalEntity: {
      sql: `${CUBE.globalEntityId} = ${GlobalEntity.id}`,
      relationship: `belongsTo`
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, globalEntityId]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    globalEntityId: {
      sql: `global_entity_id`,
      type: `string`
    },
  },
  
  dataSource: `default`
});
