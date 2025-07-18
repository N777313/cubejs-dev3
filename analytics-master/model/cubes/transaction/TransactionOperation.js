cube('TransactionWithTypes', {
  extends: Operation,
  title: "Транзакции с типом",
  sql: `
    SELECT 
      twt.*,
      SUM(IF(is_confirmed, IF(sign_type = 'income',1,-1) * sum, 0)) OVER(
        PARTITION BY account_id
        ORDER BY period_date ASC
      ) AS running_total 
      FROM (
      SELECT exp_t.id,
         sum,
         exp_t.id             base_document,
         'transaction'        type,
         'expenditure'     as sign_type,
         exp_d.document_date  period_date,
         exp_d.date_created,
         exp_d.date_modified,
         IF(exp_t.status = 'confirmed', 1, 0)                    is_confirmed,
         exp_d.description,
         source_account_id as account_id
      FROM transaction exp_t
               LEFT JOIN document exp_d ON exp_d.id = exp_t.id
      WHERE exp_t.source_account_id IS NOT NULL
      UNION ALL
      SELECT inc_t.id,
             sum,
             inc_t.id             base_document,
             'transaction'        type,
             'income'          as sign_type,
             inc_d.document_date  period_date,
             inc_d.date_created,
             inc_d.date_modified,
             IF(inc_t.status = 'confirmed', 1, 0)                    is_confirmed,
             inc_d.description,
             target_account_id as account_id
      FROM transaction inc_t
               LEFT JOIN document inc_d ON inc_d.id = inc_t.id
      WHERE inc_t.target_account_id IS NOT NULL
    ) twt
    `,

  joins: {
    Documents: {
      relationship: `hasOne`,
      sql: `${Documents}.id = ${TransactionWithTypes}.id`
    },
    Account: {
      relationship: `belongsTo`,
      sql: `${TransactionWithTypes}.account_id = ${Account}.id`
    },
    Transaction: {
      relationship: `belongsTo`,
      sql: `${TransactionWithTypes}.base_document = ${Transaction}.id`
    }
  },

  measures: {
    runningTotalMeasure: {
      type: `number`,
      sql: `LAST(running_total)`,
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    sum: {
      sql: `sum`,
      type: `string`
    },

    accountId: {
      sql: `account_id`,
      type: `number`
    },

    runningTotal: {
      sql: `running_total`,
      type: `number`
    }
  }

});
