cube(`EmployeeSalaryOperation`, {
  refreshKey:{
    sql: `SELECT max(date_modified) FROM operation`
  },
  extends: Operation,
  title: 'Операции по сотруднику',

  sql: `
    SELECT
     o.*,
     eo.project_id,
     eo.employee_id,
     eo.employee_operation_type,
     eo.is_deduction,
     eo.deduction_status,
     eo.bonus_type
    FROM employee_operation eo
    LEFT JOIN operation o ON o.id = eo.id
  `,

  joins: {
    Employees: {
      sql: `${CUBE}.employee_id = ${Employees}.id`,
      relationship: `belongsTo`
    },
    BaseDocuments: {
      relationship: `belongsTo`,
      sql: `${BaseDocuments}.id = ${CUBE}.base_document`
    },
    Documents: {
      relationship: `belongsTo`,
      sql: `${Documents}.id = ${CUBE}.base_document`
    },
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE}.project_id = ${MultiProjects}.id`
    },
  },

  measures: {
    avgSalary: {
      type: `number`,
      sql: `${CUBE.incomeSum} / COUNT(DISTINCT ${CUBE.employeeId}) `,
      title: "Средняя ЗП"
    },

    salaryDeductionSum: {
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        { sql: `${CUBE.isDeduction}`}
      ],
      title: "Сумма удержаний"
    },

    salaryDeductionExpenditureSum: {
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        { sql: `${CUBE.isDeduction}` },
        { sql: `${CUBE.paid}` }
      ],
    },

    salaryDeductionCanceledSum: {
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        { sql: `${CUBE.isDeduction}` },
        { sql: `${CUBE.canceled}` }
      ],
    },

    salaryDeductionBalance: {
      type: `sum`,
      sql: `IF(deduction_status = 'canceled', 0, IF(deduction_status = 'paid', -1, 1)) * ${CUBE.sum}`,
      filters: [
         { sql: `${CUBE.isDeduction}` },
      ],
      rollingWindow: {
        trailing: 'unbounded',
      },
      title: "Баланс удержаний"
    },

    bonusGrossProfit: {
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        { sql: `${CUBE.bonusType} = 'on_every_act' AND ${CUBE.signType} = 'income'` }
      ],
    },
    bonusOnEveryContractSign: {
      type: `sum`,
      sql: `${CUBE.sum}`,
      filters: [
        { sql: `${CUBE.bonusType} = 'on_contract_sign' AND ${CUBE.signType} = 'income'` }
      ],
    },
  },

  dimensions: {
    employeeId: {
      sql: `employee_id`,
      type: `number`,
      title: "№ сотрудика"
    },
    operationType: {
      type: `string`,
      sql: `employee_operation_type`
    },
    paid: {
      type: 'boolean',
      sql: `IF(deduction_status = 'paid', 1, 0)`
    },
    canceled: {
     type: 'boolean',
      sql: `IF(deduction_status = 'canceled', 1, 0)`
    },
    isDeduction: {
      sql: `is_deduction`,
      type: `boolean`,
      title: 'Удержание'
    },
    bonusType: {
      sql: `bonus_type`,
      type: `string`,
      title: `Вид премии`
    },
    operationBonusType: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.operationType} = 'on_every_act'`, label: 'Премия от валовой прибыли' },
        ],
      },
    },
    
    operationTableLabel: {
      sql: `'Сотрудник'`,
      type: `string`
    },

    operationTypeLabel: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.operationType} = 'piece_work_payroll'`, label: 'Начисление сдельной ЗП' },
          { sql: `${CUBE.operationType} = 'deduction_payroll'`, label: 'Начисление удержания' },
          { sql: `${CUBE.operationType} = 'salary_payment'`, label: 'Транзакция' },
          { sql: `${CUBE.operationType} = 'fixed_payroll'`, label: 'Начисление оклада' },
          { sql: `${CUBE.operationType} = 'fine'`, label: 'Начисление штрафа' },
          { sql: `${CUBE.operationType} = 'bonus'`, label: 'Начисление премии' },
          { sql: `${CUBE.operationType} = 'additional_payment'`, label: 'Начисление доплаты' },
          { sql: `${CUBE.operationType} = 'advance_payment'`, label: 'Начисление аванса' },
          { sql: `${CUBE.operationType} = 'tool_loan'`, label: 'Выдача займа на инструмент' },
          { sql: `${CUBE.operationType} = 'tool_loan_payment'`, label: 'Погашение займа на инструмент' },
          { sql: `${CUBE.operationType} = 'tool_loan_cancel'`, label: 'Списание займа на инструмент' },
          { sql: `${CUBE.operationType} = 'adjustment'`, label: 'Корректировка долга' },
          { sql: `${CUBE.operationType} = 'deduction_cancel'`, label: 'Списание удержания в счёт компании' }
        ],
      },
    }
  }
})