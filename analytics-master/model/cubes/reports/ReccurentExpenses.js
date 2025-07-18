const {query} = require("../fetch");

const buildEqualsCondition = (key) => {
  return Array.isArray(key)
      ? `IN (${key.map(key => `'${key}'`).join(',')})` : `= '${key}'`;
}

const getConfigValueByKey = (key) => {
  const condition = buildEqualsCondition(key);
  return `(select value from app_config_variable where \`key\` ${condition})`;
}

const getFormDefaultValuesByKey = (key) => {
  const condition = buildEqualsCondition(key);
  return `(select value from form_default_values where \`field\` ${condition})`;
}

const getExpenseIdKey = (key) => {
  return RECCURENT_EXPENSES_CONFIG[key].operationExpenseKey;
}

const RECCURENT_EXPENSES_CONFIG = Object.fromEntries(Object.entries({
  'ROYALTY_PERCENT': {
    title: 'Роялти по работам',
    operationExpenseKey: 'royaltyWorksOperationExpenseId'
  },
  'MATERIAL_ROYALTY_PERCENT': {
    title: 'Роялти по материалам',
    operationExpenseKey: 'royaltyMaterialsOperationExpenseId'
  },
  'DESIGN_ROYALTY_PERCENT': {
    title: 'Роялти по дизайну',
    operationExpenseKey: 'royaltyDesignOperationExpenseId'
  },
  'SERVER_PAYMENT': {
    title: 'Сервер',
  },
  'SERVER_WAREHOUSE_AND_LOAD': {
    title: 'Сервер: склад и нагрузка',

  },
  'ANNUAL_PAYMENTS_DOMAIN': {
    title: 'Ежегодные платежи: домен',
  },
  'ANNUAL_PAYMENTS_HOSTING': {
    title: 'Ежегодные платежи: хостинг',

  },
  'ANNUAL_PAYMENTS_HTTPS_CERTIFICATE': {
    title: 'Ежегодные платежи: HTTPS-сертификат',
  },
  'MARKETING_COLLECTION_PERCENT': {
    title: 'Маркетинг: сборы',
  },
}).map(([key, value]) => [key, {
  ...value,
  key,
}]));


const ACTIVITY_DIRECTION_MAP = {
  [RECCURENT_EXPENSES_CONFIG.ROYALTY_PERCENT.key]: 'works',
  [RECCURENT_EXPENSES_CONFIG.MATERIAL_ROYALTY_PERCENT.key]: 'materials',
  [RECCURENT_EXPENSES_CONFIG.DESIGN_ROYALTY_PERCENT.key]: 'design',
};

const ANNUAL_PAYMENTS_KEYS = [
  RECCURENT_EXPENSES_CONFIG.ANNUAL_PAYMENTS_DOMAIN.key,
  RECCURENT_EXPENSES_CONFIG.ANNUAL_PAYMENTS_HOSTING.key,
  RECCURENT_EXPENSES_CONFIG.ANNUAL_PAYMENTS_HTTPS_CERTIFICATE.key,
];



// generate sql for 12 months
const generateDataForStaticAnnualExpenses =  (fromDate) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const startYear = new Date(fromDate).getFullYear();
  const endYear = new Date().getFullYear();
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const generateDateForYear = (key, year) => {
    return months.map(month => {
      return `SELECT 
        '${RECCURENT_EXPENSES_CONFIG[key].title}' as \`key\`,
        ${getConfigValueByKey(key)} as value,
        '${year}-${month}-01' as month
      `;
    }).join(' UNION ALL ');
  };

  return years.map(year => {
    return ANNUAL_PAYMENTS_KEYS.map((key) => {
      return generateDateForYear(key, year);
    }).join(' UNION ALL ');
  }).join(' UNION ALL ');
}
const FORM_DEFAULT_VALUES_FORM = 'OPIU_PAY_AMORTIZATION';
asyncModule(async () => {
  const royaltyKeys = Object.keys(ACTIVITY_DIRECTION_MAP);
  const royaltyExpenseKeys = royaltyKeys.map(getExpenseIdKey);
  const royaltyExpenseIdsEntries = (await query(getFormDefaultValuesByKey(royaltyExpenseKeys))).map(({ value }, index) => [royaltyKeys[index], value]);
  const royaltyExpenseIds = Object.fromEntries(royaltyExpenseIdsEntries);


  cube('Royalties', {
    sql: `select op.*, mo.operation_expense_id, ad.type ad_type, acv.value royaltyPercent from management_operation mo 
  left join operation op on mo.id = op.id 
  left join activity_direction ad on mo.activity_direction_id = ad.id
  left join app_config_variable acv  
    ON acv.key = (
    CASE 
      WHEN ad.type = 'works' THEN 'ROYALTY_PERCENT' 
      WHEN ad.type = 'materials' THEN 'MATERIAL_ROYALTY_PERCENT' 
      WHEN ad.type = 'design' THEN 'DESIGN_ROYALTY_PERCENT'  
    END
  )
  where sign_type = 'income' or operation_expense_id in (${Object.values(royaltyExpenseIds).join(',')})
  
`,
    title: 'Роялти',

    measures: {
      ...Object.fromEntries(Object.entries(ACTIVITY_DIRECTION_MAP).map(([key, value]) => {
            return [`${key}Sum`, {
              type: 'sum',
              sql: `${CUBE.royaltySum}`,
              filters: [{
                sql: `ad_type = '${value}'`,
              }],
              title: `${RECCURENT_EXPENSES_CONFIG[key].title} Сумма`,
            }]
          }
      )),


      ...Object.fromEntries(Object.entries(ACTIVITY_DIRECTION_MAP).map(([key, value]) => {
            return [`${key}Plan`, {
              type: 'sum',
              sql: `${CUBE.royaltySum}`,
              filters: [{
                sql: `ad_type = '${value}' AND sign_type = 'expenditure'`,
              }],
              title: `${RECCURENT_EXPENSES_CONFIG[key].title} План`,
            }]
          }
      )),
      ...Object.fromEntries(Object.entries(ACTIVITY_DIRECTION_MAP).map(([key, value]) => {
            return [`${key}Fact`, {
              type: 'sum',
              sql: `sum`,
              filters: [{
                sql: `ad_type = '${value}' AND sign_type = 'income' AND operation_expense_id = ${royaltyExpenseIds[key]}`,
              }],
              title: `${RECCURENT_EXPENSES_CONFIG[key].title} Факт`,
            }]
          }
      )),
    },

    dimensions: {
      date: {
        sql: `period_date`,
        type: `time`,
        title: `Дата`,
      },
      royaltySum: {
        type: `number`,
        sql: `IF(sign_type = 'income', ROUND(sum * royaltyPercent, 2), sum)`,
        title: `Сумма Роялти`,
      },
      royaltyPercent: {
        type: `number`,
        sql: `royaltyPercent`,
        title: `Процент Роялти`,
      },
      type: {
        sql: `CASE
        WHEN sign_type = 'expenditure' THEN 'Факт'
        WHEN sign_type = 'income' THEN 'План'
      END`,
        type: `string`,
        title: `Тип`,
      },
    }
  })
});

asyncModule(async () => {
  const firstDateFromManagementOperations = (await query(`
    SELECT 
      MIN(period_date) as firstDate
    FROM management_operation
    LEFT JOIN operation ON management_operation.id = operation.id
    WHERE operation.sign_type = 'expenditure'
   `))[0].firstDate;

  cube('ReccurentAnnualExpenses', {
    // preAggregations: {
    //   main: {
    //     type: 'originalSql',
    //   }
    // },
    sql: generateDataForStaticAnnualExpenses(firstDateFromManagementOperations),
    title: 'Ежегодные платежи',
    measures: {
      value: {
        type: 'sum',
        sql: `value`,
        title: 'Сумма',
      },
    },
    dimensions: {
      key: {
        type: 'string',
        sql: `key`,
        title: 'Ключ',
      },
      date: {
        type: 'time',
        sql: `month`,
        title: 'Месяц',
      },
    },
  });
});



