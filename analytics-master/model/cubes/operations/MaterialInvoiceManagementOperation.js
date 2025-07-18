const filterMoExcludingMargin = (operationAlias) => `${operationAlias}.description NOT LIKE '%наценка'`;
const filterMoByMargin = (operationAlias) => `${operationAlias}.description LIKE '%наценка'`;

cube('MaterialInvoiceManagementOperation', {
  sql: `
    SELECT
      o_main.id,
      o_main.sum as sale_sum,
      o_main.period_date,
      o_main.is_confirmed,
      o_main.is_deleted,
      o_main.base_document,
      mi.orderer_employee_id,
      d.project_id,
      COALESCE(o_profit.sum, 0) as profit
    FROM
      management_operation mo_main
      INNER JOIN operation o_main ON mo_main.id = o_main.id
            AND ${filterMoExcludingMargin('o_main')}
      INNER JOIN document d ON o_main.base_document = d.id
            AND d.type = 'materials_invoice'
      INNER JOIN materials_invoice mi ON d.id = mi.id

      LEFT JOIN operation o_profit ON o_main.base_document = o_profit.base_document
            AND ${filterMoByMargin('o_profit')}
  `,
  title: "Операции УУ по накладным (с Прибылью из Наценки)",
  description: "Основные операции управленческого учета по накладным. Прибыль берется из отдельной операции 'наценки'.",

  joins: {
    MaterialInvoice: {
      relationship: `belongsTo`,
      sql: `${CUBE.baseDocumentId} = ${MaterialInvoice.id}`
    },
    Employees: {
       relationship: 'belongsTo',
       sql: `${CUBE.ordererEmployeeId} = ${Employees.id}`
     },
    MultiProjects: {
        relationship: 'belongsTo',
        sql: `${CUBE.projectId} = ${MultiProjects.id}`
     }
  },

  measures: {
     count: {
       type: 'count',
       title: 'Количество накладных'
     },
     totalProfit: {
        sql: 'profit',
        type: 'sum',
        title: 'Общая прибыль (сумма наценок)'
     },
     totalSaleSum: {
        sql: 'sale_sum',
        type: 'sum',
        title: 'Общая сумма продаж (без наценки)'
     }
    },

  dimensions: {
      id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: 'ID Основной Операции УУ'
    },
    saleSum: {
      sql: `sale_sum`,
      type: `number`,
      title: 'Сумма продажи (без наценки)'
    },
    profit: {
      sql: 'profit',
      type: 'number',
      title: 'Прибыль (сумма наценки)'
    },
    periodDate: {
      sql: `period_date`,
      type: `time`,
      title: 'Дата операции УУ'
    },
    isConfirmed: {
      sql: `is_confirmed`,
      type: `boolean`,
      title: 'Операция УУ подтверждена'
    },
    isDeleted: {
      sql: `is_deleted`,
      type: `boolean`,
      title: 'Операция УУ удалена'
    },
    baseDocumentId: {
      sql: `base_document`,
      type: `number`,
      title: 'ID Накладной (Основание)'
    },
    ordererEmployeeId: {
      sql: `orderer_employee_id`,
      type: `number`,
      title: 'ID Заказчика (Сотрудник)'
    },
    projectId: {
        sql: `project_id`,
        type: 'number',
        title: 'ID Проекта'
    }
  }
}); 