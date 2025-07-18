cube(`WorkContractPrice`, {
  sql: `
    SELECT 
        work_type_id,
        price,
        is_external,
        contract_id 
    FROM work_contract_price`,
  
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: []
    }
  },
  
  dimensions: {
    id: {
      sql: `CONCAT(${CUBE.workTypeId}, '-', ${CUBE.contractId})`,
      type: `string`,
      primaryKey: true
    },
    workTypeId: {
      sql: `work_type_id`,
      type: `number`
    },
    contractId: {
      sql: `contract_id`,
      type: `number`
    },
    isExternal: {
      sql: `is_external`,
      type: `boolean`
    },
    price: {
      sql: `price`,
      type: `string`
    }
  },
  
  dataSource: `default`
});
