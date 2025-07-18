const {query} = require("../fetch");

const getConfigValueByKey = (key) => `(select value from app_config_variable where \`key\` = '${key}')`

asyncModule(async () => {
  const config = (await query(`
    SELECT \`key\`, value  FROM app_config_variable
    WHERE \`key\` = 'ROYALTY_PERCENT'
   `));
  const ROYALTY_PERCENT = config[0]?.value ?? 0;

  const configMaterial = (await query(`
    SELECT \`key\`, value  FROM app_config_variable
    WHERE \`key\` = 'MATERIAL_ROYALTY_PERCENT'
   `));
  const MATERIAL_ROYALTY_PERCENT = configMaterial[0]?.value ?? 0;

  const configDesign = (await query(`
    SELECT \`key\`, value  FROM app_config_variable
    WHERE \`key\` = 'DESIGN_ROYALTY_PERCENT'
   `));
  const DESIGN_ROYALTY_PERCENT = configDesign[0]?.value ?? 0;

  cube('ManagementOperation', {
    refreshKey:{every:'1 hour'},
    extends: Operation,
    sql: `
    SELECT 
      o.*, 
      mo.operation_expense_id,
      mo.activity_direction_id,
      mo.employee_id,
      coalesce(sum * ${getConfigValueByKey('ROYALTY_PERCENT')},0) as royaltyPlanSum,
      coalesce(sum * ${getConfigValueByKey('MATERIAL_ROYALTY_PERCENT')},0) as materialRoyaltyPlanSum,
      coalesce(sum * ${getConfigValueByKey('DESIGN_ROYALTY_PERCENT')},0) as designRoyaltyPlanSum,
      ad.type as activity_direction_type
      FROM management_operation mo
      INNER JOIN operation o ON mo.id = o.id
      LEFT JOIN activity_direction ad on mo.activity_direction_id = ad.id
    `,
    title: "Операция управленческого учета",
    joins: {
      OperationExpense: {
        relationship: `belongsTo`,
        sql: `${CUBE}.operation_expense_id = ${OperationExpense}.id`
      },
      Employees: {
         relationship: `belongsTo`,
        sql: `${CUBE}.employee_id = ${Employees}.id`
      },
      ActivityDirection: {
        relationship: `belongsTo`,
        sql: `${CUBE}.activity_direction_id = ${ActivityDirection}.id`
      },
      Act: {
        relationship: `belongsTo`,
        sql: `${Act}.id = ${CUBE}.base_document`
      },
      Documents: {
        relationship: `belongsTo`,
        sql: `${Documents}.id = ${CUBE}.base_document`
      },
    },

    measures: {
      revenue: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income'`
        }],
        format: `currency`,
        title: `Доход`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      royaltyPlan: {
        type: `sum`,
        sql: `royaltyPlanSum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income'`
        }],
        format: `currency`,
        title: `Роялти (план) - ${ROYALTY_PERCENT * 100}%`,
        drillMembers: [OperationExpensePath.path, royaltyPlanSum, id],
        meta: {
          order: 2
        },
      },
      royaltyPlanWorks: {
        type: `sum`,
        sql: `royaltyPlanSum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income' and activity_direction_type = 'works'`
        }],
        format: `currency`,
        title: `Роялти (план) работы - ${ROYALTY_PERCENT * 100}%`,
        drillMembers: [OperationExpensePath.path, royaltyPlanSum, id],
        meta: {
          order: 2
        },
      },
      royaltyPlanMaterials: {
        type: `sum`,
        sql: `materialRoyaltyPlanSum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income' and activity_direction_type = 'materials'`
        }],
        format: `currency`,
        title: `Роялти (план) материалы - ${MATERIAL_ROYALTY_PERCENT * 100}%`,
        drillMembers: [OperationExpensePath.path, royaltyPlanSum, id],
        meta: {
          order: 2
        },
      },
      royaltyPlanDesign: {
        type: `sum`,
        sql: `designRoyaltyPlanSum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income' and activity_direction_type = 'design'`
        }],
        format: `currency`,
        title: `Роялти (план) дизайн - ${DESIGN_ROYALTY_PERCENT * 100}%`,
        drillMembers: [OperationExpensePath.path, royaltyPlanSum, id],
        meta: {
          order: 2
        },
      },
      royaltyFact: {
        type: `sum`,
        sql: `sum`,
        format: `currency`,
        title: `Роялти (факт)`,
        filters: [{
          sql: `${OperationExpense.type} = 'royalty'`
        }],
        meta: {
          order: 3
        }
      },
      royaltyFactWorks: {
        type: `sum`,
        sql: `sum`,
        format: `currency`,
        title: `Роялти (факт) работы`,
        filters: [{
          sql: `${OperationExpense.type} = 'royalty' and activity_direction_type = 'works'`
        }],
        meta: {
          order: 4
        }
      },
      royaltyFactMaterials: {
        type: `sum`,
        sql: `sum`,
        format: `currency`,
        title: `Роялти (факт) материалы`,
        filters: [{
          sql: `${OperationExpense.type} = 'royalty' and activity_direction_type = 'materials'`
        }],
        meta: {
          order: 5
        }
      },
      royaltyFactDesign: {
        type: `sum`,
        sql: `sum`,
        format: `currency`,
        title: `Роялти (факт) дизайн`,
        filters: [{
          sql: `${OperationExpense.type} = 'royalty' and activity_direction_type = 'design'`
        }],
        meta: {
          order: 6
        }
      },
      factory: {
        type: `sum`,
        sql: `-1 * sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'expenditure'`
        }],
        format: `currency`,
        title: 'Производственные расходы',
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 7
        },
      },
      serverPayment: {
        type: `number`,
        sql: `(select value from app_config_variable where \`key\` = 'SERVER_PAYMENT') / 30`,
        title: 'Оплата сервера (план)',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      serverPaymentFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('SERVER_PAYMENT_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Оплата сервера (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      serverWarehouseAndLoad: {
        type: `number`,
        sql: `${CUBE.revenue} * ${getConfigValueByKey('SERVER_WAREHOUSE_AND_LOAD')}`,
        title: 'Оплата сервера (нагрузка и хранилище) (план)',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      serverWarehouseAndLoadFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('SERVER_WAREHOUSE_AND_LOAD_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Оплата сервера (нагрузка и хранилище) (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      annualPaymentDomain: {
        type: `number`,
        sql: `${getConfigValueByKey('ANNUAL_PAYMENTS_DOMAIN')} / 365`,
        title: 'Оплата домена (план)',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      annualPaymentDomainFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('ANNUAL_PAYMENTS_DOMAIN_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Оплата домена (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      annualPaymentHosting: {
        type: `number`,
        sql: `${getConfigValueByKey('ANNUAL_PAYMENTS_HOSTING')} / 365`,
        title: 'Оплата хостинга (план)',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      annualPaymentHostingFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('ANNUAL_PAYMENTS_HOSTING_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Оплата хостинга (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      annualPaymentCertificateHTTPS: {
        type: `number`,
        sql: `${getConfigValueByKey('ANNUAL_PAYMENTS_HTTPS_CERTIFICATE')} / 365`,
        title: 'Оплата сертификата HTTPS (план)',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      annualPaymentCertificateHTTPSFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('ANNUAL_PAYMENTS_HTTPS_CERTIFICATE_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Оплата сертификата HTTPS (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      grossProfit: {
        type: `number`,
        sql: `${CUBE.revenue} + ${CUBE.factory}`,
        title: 'Валовая прибыль',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      marketingCollectionSum: {
        type: `number`,
        sql: `(${CUBE.revenue} + ${CUBE.factory}) * coalesce(${getConfigValueByKey('MARKETING_COLLECTION_PERCENT')}, 0)`,
        title: 'Маркетинговый сбор',
        format: `currency`,
        meta: {
          order: 8
        },
      },
      marketingCollectionFact: {
        type: `sum`,
        sql: `sum`,
        filters: [{
          sql: `${CUBE}.operation_expense_id = ${getConfigValueByKey('MARKETING_COLLECTION_OPERATION_EXPENSE_ID')}`
        }],
        format: `currency`,
        title: `Маркетинговый сбор (факт)`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 1
        },
      },
      factoryRevenuePercent: {
        type: `number`,
        format: `percent`,
        sql: `100 * (-1 * ${CUBE.factory}  / ${CUBE.revenue})`,
      },
      grossProfitability: {
        type: `number`,
        format: `percent`,
        sql: `100 * ((${CUBE.revenue} + ${CUBE.factory})  / ${CUBE.revenue})`,
        title: 'Валовая рентабельность',
        meta: {
          order: 9
        },
      },
      com: {
        type: `sum`,
        sql: `-1 * sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'com' AND ${CUBE.signType} = 'expenditure'`
        }],
        title: 'Коммерческие расходы',
        format: `currency`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 10
        },
      },
      amortization: {
        type: `number`,
        sql: `coalesce(${CUBE.royaltyFactWorks},0) +
              coalesce(${CUBE.royaltyFactMaterials},0) +
              coalesce(${CUBE.royaltyFactDesign},0) +
              coalesce(${CUBE.serverPaymentFact},0) +
              coalesce(${CUBE.serverWarehouseAndLoadFact},0) +
              coalesce(${CUBE.annualPaymentCertificateHTTPSFact},0) +
              coalesce(${CUBE.annualPaymentDomainFact},0) +
              coalesce(${CUBE.marketingCollectionFact},0) +
              coalesce(${CUBE.annualPaymentHostingFact},0)`,
        title: 'Амортизация',
        format: `currency`,
        meta: {
          order: 10
        },
      },
      amortizationPercent: {
        type: `number`,
        format: `percent`,
        sql: `100 * ((${CUBE.amortization}) / ${CUBE.revenue})`,
        title: 'Амортизация (%)',
        meta: {
          order: 9
        },
      },
      comRevenuePercent: {
        type: `number`,
        format: `percent`,
        sql: `100 * (-1 * ${CUBE.com}  / ${CUBE.revenue})`,
      },
      admin: {
        type: `sum`,
        sql: `-1 * sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'admin' AND ${CUBE.signType} = 'expenditure'`
        }],
        title: 'Административные расходы',
        format: `currency`,
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 7
        },
      },
      adminRevenuePercent: {
        type: `number`,
        format: `percent`,
        sql: `100 * (-1 *${CUBE.admin}  / ${CUBE.revenue})`,
      },
      operatingProfit: {
        type: `number`,
        format: `currency`,
        sql: `${CUBE.grossProfit} + ${CUBE.admin}`,
        title: 'Операционная прибыль',
        meta: {
          order: 8
        },
      },
      operatingProfitability: {
        type: `number`,
        format: `percent`,
        sql: `100 * ((${CUBE.grossProfit} + ${CUBE.admin}) / ${CUBE.revenue})`,
        title: 'Операционная рентабельность',
        meta: {
          order: 9
        },
      },
      taxes: {
        type: `sum`,
        format: `currency`,
        sql: `-1 * sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'taxes' AND ${CUBE.signType} = 'expenditure'`
        }],
        title: 'Налоги',
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 11
        },
      },
      others: {
        type: `sum`,
        title: 'Другое',
        format: `currency`,
        sql: `-1 * sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'default' AND ${CUBE.signType} = 'expenditure'`
        }],
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 12
        },
      },
      clearProfit: {
        type: `number`,
        format: `currency`,
        sql: `${CUBE.operatingProfit} + ${CUBE.com} + ${CUBE.amortization} + IFNULL(${CUBE.taxes},0) + IFNULL(${CUBE.others},0)`,
        title: 'Чистая прибыль',
        meta: {
          order: 13
        },
      },
      clearProfitability: {
        type: `number`,
        format: `percent`,
        sql: `100 * ((${CUBE.operatingProfit} + ${CUBE.com} + IFNULL(${CUBE.taxes},0) + IFNULL(${CUBE.others},0)) / ${CUBE.revenue})`,
        title: 'Чистая рентабельность',
        meta: {
          order: 14
        },
      },
      dividends: {
        type: `sum`,
        title: 'Дивиденды',
        format: `currency`,
        sql: `sum`,
        filters: [{
          sql: `${OperationExpense.type} = 'dividends' AND ${CUBE.signType} = 'expenditure'`
        }],
        drillMembers: [OperationExpensePath.path, sum, id],
        meta: {
          order: 15
        },
      }
    },

    dimensions: {
      opiuType: {
        type: 'string',
        sql: `IF(${OperationExpense.type} = 'factory' AND ${CUBE.signType} = 'income', 'revenue', ${OperationExpense.type})`
      },
      opiuLabel: {
        type: `string`,
        case: {
          when: [
            {
              sql: `${CUBE.opiuType} = 'factory'`,
              label: 'Производственные расходы'
            },
            {
              sql: `${CUBE.opiuType} = 'revenue'`,
              label: 'Выручка'
            },
            {
              sql: `${CUBE.opiuType} = 'taxes'`,
              label: 'Налоги'
            },
            {
              sql: `${CUBE.opiuType} = 'admin'`,
              label: 'Административные расходы'
            },
            {
              sql: `${CUBE.opiuType} = 'com'`,
              label: 'Коммерческие расходы'
            }
          ],
          else : {
            label: 'Другое'
          }
        }

      },

      operationTableLabel: {
        sql: `'Управление'`,
        type: `string`
      },
    }
  })

})
