cube(`DiscountContractAgreement`, {
  extends: ContractAgreement,
  title: 'Доп. соглашение о скидке',
  sql: `
    SELECT 
        ca.*, 
        dca.discount_sum 
    FROM discount_contract_agreement dca
    LEFT JOIN ${ContractAgreement.sql()} ca ON ca.id = dca.id
    `,
  
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
      title: 'Кол-во'
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    discountSum: {
      sql: `discount_sum`,
      type: `string`,
      title: 'Сумма скидки'
    }
  },
  
});
