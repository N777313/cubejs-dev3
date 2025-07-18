cube(`TerminationContractAgreement`, {
  extends: ContractAgreement,
  title: 'Соглашение о расторжении договора',

  sql: `
    SELECT ca.* 
    FROM termination_contract_agreement tca 
    LEFT JOIN ${ContractAgreement.sql()} ca ON tca.id = ca.id
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
