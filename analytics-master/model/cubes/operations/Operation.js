cube(`BaseDocuments`, {
  extends: Documents,
  title: 'Базовый документ операции',
  sqlAlias: `operationBaseDocuments`,
  joins: {
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE.projectId} = ${MultiProjects.id}`
    },
  }
})

function ratioMeasure(measure, granularity, title) {
  const getDate = (SQL_UTILS, CUBE) => {
    if (granularity === 'week') {
      return {
        format: '%Y-%m-%dT00:00:00.000',
        date: `
          DATE_ADD(
            '1900-01-01',
            INTERVAL TIMESTAMPDIFF(
              WEEK,
              '1900-01-01',
              ${SQL_UTILS.convertTz(CUBE.documentDate)}
            ) WEEK
          )
        `
      }
    }
    if (granularity === 'month') {
      return {
        format: '%Y-%m-01T00:00:00.000',
        date: `${SQL_UTILS.convertTz(CUBE.documentDate)}`
      }
    }
  }

  return {
    sql: (CUBE, SQL_UTILS) => {
      const {date, format} = getDate(SQL_UTILS, CUBE);

      return `${CUBE[measure]} / SUM(${CUBE[measure]}) over (
        PARTITION BY CAST(
            DATE_FORMAT(
              ${date},
              '${format}'
            ) AS DATETIME
          )
        )
      `
    },
    type: `number`
  }
}

cube(`Operation`, {
  refreshKey:{every:'1 hour'},
  sql: `
      SELECT id,
             sum,
             base_document,
             type,
             sign_type,
             period_date,
             date_created,
             date_modified,
             is_confirmed,
             is_deleted,
             description,
             paid_by_document,
             transfer_transaction
      FROM operation`,

  joins: {
    BaseDocuments: {
      relationship: `belongsTo`,
      sql: `${CUBE.baseDocumentId} = ${BaseDocuments.id}`
    },
    ProjectClientOperation: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${ProjectClientOperation.id}`,
    },
    ManagementOperation: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${ManagementOperation.id}`,
    },
    EmployeeSalaryOperation: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${EmployeeSalaryOperation.id}`
    },
    Transaction: {
      relationship: `belongsTo`,
      sql: `${CUBE.baseDocumentId} = ${Transaction.id}`
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: 'Количество',
    },
    operationSum: {
      sql: `IFNULL(sum(${CUBE.sum}), 0)`,
      type: `number`,
      title: 'Сумма',
    },
    balanceAtStart: {
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      rollingWindow: {
        trailing: 'unbounded',
        offset: 'start'
      },
      format: 'currency',
      title: "Баланс на начало периода"
    },
    balanceAtEnd: {
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      rollingWindow: {
        trailing: 'unbounded',
        offset: 'end',
      },
      format: 'currency',
      title: "Баланс на конец периода"
    },
    balance: {
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      rollingWindow: {
        trailing: 'unbounded',
      },
      format: 'currency',
      title: "Баланс"
    },
    periodBalance: {
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      title: "Баланс за период",
      format: 'currency',
    },
    incomeSum: {
      type: `sum`,
      sql: `sum`,
      format: 'currency',
      filters: [
        {sql: `${CUBE.signType} = 'income'`},
        {sql: `${CUBE.isConfirmed}`},
      ],
      title: "Сумма начислений"
    },
    incomeSumRatio: {
      sql: `${CUBE.incomeSum} / SUM(${CUBE.incomeSum}) over ()`,
      type: `number`,
      title: "Процент суммы начислений"
    },

    incomeSumRatioMonth: ratioMeasure('incomeSum', 'month', "Процент суммы начислений (месяц)"),

    incomeSumRatioWeek: ratioMeasure('incomeSum', 'week', "Процент суммы начислений (неделя)"),

    avgDocumentIncomeSum: {
      type: `number`,
      sql: `${CUBE.incomeSum} / COUNT(DISTINCT base_document)`,
      format: `currency`,
      title: "Средняя сумма начислений по документу"
    },
    expenditureSum: {
      type: `sum`,
      sql: `sum`,
      format: 'currency',
      filters: [
        {sql: `${CUBE.signType} = 'expenditure'`},
        {sql: `${CUBE.isConfirmed}`},
      ],
      title: "Сумма списаний"
    },
    expenditureSumRatio: {
      sql: `${CUBE.expenditureSum} / SUM(${CUBE.expenditureSum}) over ()`,
      type: `number`,
      title: "Процент суммы списаний"
    },

    expenditureSumRatioMonth: ratioMeasure('expenditureSum', 'month', 'Процент суммы списаний (месяц)'),

    expenditureSumRatioWeek: ratioMeasure('expenditureSum', 'week', 'Процент суммы списаний (неделя)'),

    profit: {
      type: `sum`,
      sql: `IF(${CUBE.signType} = 'income', ${CUBE.sum}, -${CUBE.sum})`,
      format: 'currency',
      title: "Прибыль"
    },
    profitability: {
      type: `number`,
      sql: `100 * ((${CUBE.profit} / ${CUBE.incomeSum}))`,
      format: `percent`,
      title: "Маржинальность"
    },
    avgDocumentProfitSum: {
      type: `number`,
      sql: `${CUBE.profit} / COUNT(DISTINCT base_document)`,
      format: `currency`,
      title: "Средняя прибыль по документу"
    },

  },

  segments: {
    incomes: {
      sql: `${CUBE.signType} = 'income'`,
      title: "Начисления"
    },
    expenditures: {
      sql: `${CUBE.signType} = 'expenditure'`,
      title: "Списания"
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: "№"
    },

    dateCreated: {
      sql: `${CUBE}.date_created`,
      type: `time`,
      title: 'Дата создания'
    },

    dateModified: {
      sql: `${CUBE}.date_modified`,
      type: `time`,
      title: 'Дата модификации'
    },

    documentDate: {
      sql: `${CUBE}.period_date`,
      type: `time`,
      title: 'Дата'
    },

    description: {
      sql: `description`,
      type: `string`,
      title: "Описание"
    },

    baseDocumentId: {
      sql: `base_document`,
      type: `number`
    },

    paidByDocumentId: {
      sql: `paid_by_document`,
      type: `number`
    },

    baseCounterpartyId: {
      sql: `base_counterparty`,
      type: `number`
    },

    expenseType: {
      sql: `expense_type`,
      type: `string`,
      title: "Тип"
    },

    signType: {
      sql: `sign_type`,
      type: `string`,
      title: "Начисление / списание"
    },

    signTypeLabel: {
      sql: `IF(${CUBE.signType} = 'income', 'Начисление', 'Списание')`,
      type: `string`
    },

    operationTableLabel: {
      sql: `COALESCE(${EmployeeSalaryOperation.operationTableLabel}, ${ProjectClientOperation.operationTableLabel}, ${ManagementOperation.operationTableLabel})`, 
      type: `string`
    },

    operationType: {
      sql: `COALESCE(${EmployeeSalaryOperation.operationType}, ${ProjectClientOperation.operationType})`,
      type: `string`
    },

    operationTypeLabel: {
      sql: `COALESCE(${EmployeeSalaryOperation.operationTypeLabel}, ${ProjectClientOperation.operationTypeLabel})`,
      type: `string`
    },

    baseDocumentAndOperationTypeDescription: {
      sql: `CONCAT(${BaseDocuments.nameWithDescription}, ' ' , ${CUBE.operationTypeLabel})`,
      type: `string`
    },

    isConfirmed: {
      sql: `is_confirmed`,
      type: `boolean`,
      title: 'Подтвержден'
    },

    sum: {
      sql: `sum`,
      type: `string`,
      title: "Сумма"
    },

    royaltyPlanSum: {
      sql: `sum * (select value FROM app_config_variable WHERE \`key\` = 'ROYALTY_PERCENT')`,
      type: `string`,
      title: "Сумма плана роялти"
    },

    materialRoyaltyPlanSum: {
      sql: `sum * (select value FROM app_config_variable WHERE \`key\` = 'MATERIAL_ROYALTY_PERCENT')`,
      type: `string`,
      title: "Сумма плана роялти по материалам"
    },

    signSum: {
      sql: `IF(${CUBE.signType} = 'income', ${CUBE.sum}, -${CUBE.sum})`,
      type: `number`,
      title: "Сумма со знаком"
    },

    income: {
      type: `number`,
      sql: `IF(${CUBE.signType} = 'income', ${CUBE.sum}, 0)`,
      title: "Сумма начисления"
    },

    expenditure: {
      type: `number`,
      sql: `IF(${CUBE.signType} = 'expenditure', ${CUBE.sum}, 0)`,
      title: "Сумма списания"
    },

    paid: {
      type: `boolean`,
      sql: `${CUBE}.paid_by_document IS NOT null`,
    },

    hasTransfer: {
      type: `boolean`,
      sql: `${CUBE}.transfer_transaction IS NOT null`,
    },

    isDeleted: {
      sql: 'is_deleted',
      type: 'boolean',
      title: 'Удален'
    }
  }
});
