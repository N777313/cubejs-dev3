cube('HandoverContractAgreement', {
  extends: ContractAgreement,
  title: 'Акт приема передачи',

  sql: `
    SELECT ca.* 
    FROM handover_contract_agreement hca
    LEFT JOIN ${ContractAgreement.sql()} ca ON ca.id = hca.id
  `
})