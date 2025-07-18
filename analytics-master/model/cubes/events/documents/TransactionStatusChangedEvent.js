cube('TransactionStatusChangedEvent', {
  extends: Event,
  sql: `
    SELECT 
      e.*,
      tce.transaction_id,
      tce.transaction_status
      FROM transaction_status_changed_event tce
    LEFT JOIN event e ON e.id = tce.id
  `,

  joins: {
    Transaction: {
      sql: `${CUBE}.transaction_id = ${Transaction}.id`,
      relationship: `belongsTo`
    },
  },

  dimensions: {
    transactionStatus: {
      type: `string`,
      sql: `transaction_status`
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
  }
})
