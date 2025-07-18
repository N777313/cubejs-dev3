cube(`Account`, {
  sql: `SELECT * FROM account`,
  title: 'Счета',
  joins: {

  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: `Номер`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: 'Название'
    },
  }
});

cube('SourceAccount', {
  extends: Account,
  title: 'Счет источник'
})

cube('TargetAccount', {
  extends: Account,
  title: 'Счет целевой'
})
