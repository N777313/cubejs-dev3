cube("IdleActContractAgreement", {
  extends: ContractAgreement,
  title: 'Акт простоя',
  sql: `
    SELECT ca.*, iace.reason_id FROM idle_act_contract_agreement iace
    LEFT JOIN ${ContractAgreement.sql()} ca ON ca.id = iace.id
    `,

  joins: {
    ProjectIdleReason: {
      sql: `${ProjectIdleReason}.id = ${IdleActContractAgreement}.reason_id`,
      relationship: `belongsTo`
    }
  },

})