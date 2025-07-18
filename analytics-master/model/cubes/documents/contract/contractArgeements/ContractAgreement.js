cube('ContractAgreement', {
  extends: Documents,
  title: 'Доп. соглашение',

  sql: `
    SELECT 
        d.*, 
        ca.contract_id 
    FROM contract_agreement ca
    LEFT JOIN document d ON ca.id = d.id
  `,

  dimensions: {
    contractId: {
      sql: `contract_id`,
      type: `number`
    }
  }
})