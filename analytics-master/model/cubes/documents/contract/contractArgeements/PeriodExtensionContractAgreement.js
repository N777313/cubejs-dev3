cube('PeriodExtensionContractAgreement', {
  extends: ContractAgreement,
  title: 'Доп. соглашение об изменении срока выполнения работ',

  sql: `
    SELECT 
        ca.*, 
        peca.extension_days
    FROM period_extension_contract_agreement peca
    LEFT JOIN ${ContractAgreement.sql()} ca ON peca.id = ca.id`,

  measures: {
    extensionDaysSum: {
      type: `sum`,
      sql: `extension_days`,
      title: 'Сумма дней продления'
    },
  },


  dimensions: {
    id: {
      sql: `id`,
      primaryKey: true,
      type: `number`
    },
    extensionDays: {
      sql: `extension_days`,
      type: `number`,
      title: 'Кол-во дней продления'
    }
  }
})