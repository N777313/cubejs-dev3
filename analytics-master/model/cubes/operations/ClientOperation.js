cube(`ProjectClientOperation`, {
  extends: Operation,

  sql: `
    SELECT
      o.*,
      co.project_id,
      co.contract_id,
      co.client_operation_type
    FROM client_operation co
    LEFT JOIN operation o ON o.id = co.id
  `,
  title: "Операция по клиенту",

  joins: {
    BaseDocuments: {
      relationship: `belongsTo`,
      sql: `${BaseDocuments}.id = ${CUBE}.base_document`
    },
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE}.project_id = ${MultiProjects}.id`
    },
    Act: {
      relationship: `belongsTo`,
      sql: `${CUBE}.base_document = ${Act}.id`
    },
    Contract: {
      relationship: `belongsTo`,
      sql: `${CUBE}.contract_id = ${Contract}.id`
    }
  },

  measures: {
    worksExpenditureSum: {
      type: `sum`,
      sql: `sum`,
      format: 'currency',
      filters: [
        {
          sql: `${Contract.type} = 'works_contract'`
        },
        {sql: `${CUBE.operationType} = 'accrual'`},
        {sql: `${CUBE.signType} = 'expenditure'`},
        {sql: `${CUBE.isConfirmed}`},
      ]
    }
  },

  dimensions: {
    contractLabel: {
      sql: `IF(contract_id,${Contract.typeLabel}, 'Общий счёт')`,
      type: `string`,
      title: "Договор тип",
    },
    operationType: {
      sql: `client_operation_type`,
      type: `string`
    },

    operationTableLabel: {
      sql: `'Клиент'`,
      type: `string`
    },

    operationTypeLabel: {
      type: `string`,
      case: {
        when: [
          {
            sql: `${CUBE.operationType} = 'accrual'`,
            label: 'Начисление за выполненные работы'
          },
          {
            sql: `${CUBE.operationType} = 'client_payment'`,
            label: 'Приход денежных средств от клиента'
          },
          {
            sql: `${CUBE.operationType} = 'client_refund'`,
            label: 'Возврат денег клиенту'
          },
          {
            sql: `${CUBE.operationType} = 'client_contract_transfer'`,
            label: 'Перевод между договорами клиента'
          },
          {
            sql: `${CUBE.operationType} = 'discount'`,
            label: 'Скидка'
          },
          {
            sql: `${CUBE.operationType} = 'adjustment'`,
            label: 'Корректировка'
          },
          {
            sql: `${CUBE.operationType} = 'margin_accrual'`,
            label: 'Начисление за материалы'
          }
        ]
      }
    }
  }
})
