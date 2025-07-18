cube(`ProjectReturnContractAgreement`, {
  extends: ContractAgreement,
  title: 'Акт возврата объекта',

  sql: `
    SELECT ca.* 
    FROM project_return_contract_agreement prca
    LEFT JOIN ${ContractAgreement.sql()} ca ON prca.id = ca.id
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
      primaryKey: true,
      title: "Номер",
    }
  },
  
  dataSource: `default`
});
