cube('ProjectSummaryOperation', {
  extends: Operation,

  sql: `
    SELECT * FROM ${Operation.sql()} o 
    WHERE expense_type IN ('salary', 'salary_deduction', 'adjustment', 'acts')
  `,

  joins: {
    Employees: {
      sql: `${CUBE}.base_counterparty = ${Employees}.id`,
      relationship: `belongsTo`
    },
    BaseDocuments: {
      relationship: `belongsTo`,
      sql: `${BaseDocuments}.id = ${CUBE}.base_document`
    },
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE}.project_id = ${MultiProjects}.id`
    },
  },

  measures: {
    projectIncome: {
      title: 'Начислено по проектам',
      type: `sum`,
      sql: `sum`,
      filters: [
        {sql: `${CUBE.signType} = 'expenditure'`},
        {sql: `${CUBE.expenseType} = 'acts'`}
      ]
    },

    projectExpenditure: {
      title: 'Оплачено по проектам',
      type: `sum`,
      sql: `sum`,
      filters: [
        {sql: `${CUBE.signType} = 'income'`},
        {sql: `${CUBE.expenseType} = 'acts'`}
      ]
    },

    projectPeriodBalance: {
      title: 'Разница по проектам',
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      filters: [{sql: `${CUBE.expenseType} = 'acts'`}],
      format: 'currency'
    },

    employeeIncome: {
      title: 'Начислено по сотрудникам',
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        {sql: `${CUBE.signType} = 'income'`},
        {sql: `${CUBE.isConfirmed}`},
        {sql: `${CUBE.expenseType} IN ('salary', 'salary_deduction')`}
      ]
    },

    employeeExpenditure: {
      title: 'Оплачено по сотрудникам',
      type: `sum`,
      sql: `sum`,
      filters: [
        {sql: `${CUBE.signType} = 'expenditure'`},
        {sql: `${CUBE.isConfirmed}`},
        {sql: `${CUBE.expenseType} IN ('salary', 'salary_deduction', 'adjustment')`}
      ]
    },

    employeePeriodBalance: {
      title: 'Разница по сотрудникам',
      type: `sum`,
      sql: `IF(${CUBE.isConfirmed}, IF(${CUBE.signType} = 'income',1,-1) * ${CUBE.sum}, 0)`,
      filters: [
        {sql: `${BaseDocuments.type} != 'ToolLoan'`},
        {sql: `${CUBE.expenseType} IN ('salary', 'salary_deduction', 'adjustment')`}
      ],
      format: 'currency'
    },
  }

})
