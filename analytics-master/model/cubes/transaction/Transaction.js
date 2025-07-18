cube(`Transaction`, {
  extends: Documents,
  sql: `
    SELECT 
      d.*,
      t.sum,
      t.source_account_id,
      t.target_account_id,
      t.status,
      t.base_document_id
    FROM transaction t
    LEFT JOIN ${Documents.sql()} d ON d.id = t.id
  `,
  title: "Транзакция",

  joins: {
    Account: {
      relationship: `belongsTo`,
      sql: `${Transaction}.target_account_id = ${Account}.id OR ${Transaction}.source_account_id = ${Account}.id`
    },
    Operation: {
      relationship: `hasMany`,
      sql: `${Transaction}.id = ${Operation}.base_document`
    },
    SourceAccount: {
      relationship: `belongsTo`,
      sql: `${Transaction}.source_account_id = ${SourceAccount}.id`
    },
    TargetAccount: {
      relationship: `belongsTo`,
      sql: `${Transaction}.target_account_id = ${TargetAccount}.id`
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },
    sumMeasure: {
      type: `sum`,
      sql: `sum`,
      title: "Сумма",
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    sum: {
      sql: `sum`,
      type: `string`
    },

    sourceAccountId: {
      sql: `source_account_id`,
      type: `number`
    },

    targetAccountId: {
      sql: `target_account_id`,
      type: `number`
    },

    type: {
      type: `string`,
      sql: `
      CASE 
        WHEN ${Transaction.sourceAccountId} AND ${Transaction.targetAccountId} THEN 'transfer'
        WHEN ${Transaction.sourceAccountId} THEN 'expenditure'
        WHEN ${Transaction.targetAccountId} THEN 'income'
      END`
    },

    typeLabel: {
      title: `Тип транзакции`,
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.type} = 'transfer'`, label: 'Перевод' },
          { sql: `${CUBE.type} = 'expenditure'`, label: 'Расход' },
          { sql: `${CUBE.type} = 'income'`, label: 'Доход' },
        ],
      }
    },

    transactionStatus: {
      type: `string`,
      sql: `status`
    },

    transactionStatusLabel: {
      title: `Статус транзакции`,
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.transactionStatus} = 'draft'`, label: 'Черновик' },
          { sql: `${CUBE.transactionStatus} = 'planned'`, label: 'Планируемая' },
          { sql: `${CUBE.transactionStatus} = 'rejected'`, label: 'Отклонена' },
          { sql: `${CUBE.transactionStatus} = 'postponed'`, label: 'Отложена' },
          { sql: `${CUBE.transactionStatus} = 'confirmed'`, label: 'Оплачена' },
        ],
        else: { label: 'Неизвестно' }
      }
    },

    transactionType: {
      type: `string`,
      sql: `transaction_type`
    },

    descriptionWithDateAndType: {
      type: `string`,
      sql: `CONCAT(${Transaction.typeLabel}, ' ', ${Transaction.dateWithDescription})`
    }
  }
});
