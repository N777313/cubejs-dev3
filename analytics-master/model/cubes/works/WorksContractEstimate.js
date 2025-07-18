cube('WorksContractEstimate', {
  extends: Estimate,
  title: 'Смета к договору',
  
  sql: `
    SELECT e.*, wc.id contract_id
    FROM ${WorksContract.sql()} wc
    LEFT JOIN ${Estimate.sql()} e ON wc.attached_estimate_id = e.id
  `,

  joins: {

  },

})