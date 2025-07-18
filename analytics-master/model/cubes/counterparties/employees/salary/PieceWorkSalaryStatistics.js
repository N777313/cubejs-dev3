cube('PieceWorkSalaryStatistics', {
  extends: PieceWorkSalary,

  sql: `
    SELECT 
      s.*,
      LAG(s.coefficient, 1) over (PARTITION BY employee_id ORDER BY salary_date) prev_coeff, 
      LAG(s.deduction_coefficient, 1) over (PARTITION BY employee_id ORDER BY salary_date) prev_deduction_coeff,
      LAG(s.level, 1) over (PARTITION BY employee_id ORDER BY salary_date) prev_level
    FROM ${PieceWorkSalary.sql()} s
  `,


  joins: {
    Employees: {
      sql: `${CUBE.employeeId} = ${Employees.id}`,
      relationship: `belongsTo`
    },

    UserEmployee: {
      sql: `${CUBE.authorUserId} = ${UserEmployee.userId}`,
      relationship: `belongsTo`
    }
  },

  dimensions: {
    prevCoefficient: {
      sql: `ROUND(prev_coeff, 2)`,
      type: `number`
    },
    prevDeductionCoefficient: {
      sql: `ROUND(prev_deduction_coeff, 2)`,
      type: `number`
    },
    prevLevel: {
      sql: `prev_level`,
      type: `number`
    },
    prevLevelLabel: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.level} = 'beginner'`, label: 'Новичок' },
          { sql: `${CUBE.level} = 'master'`, label: 'Мастер' },
          { sql: `${CUBE.level} = 'expert'`, label: 'Эксперт' },
        ],
        else: { label: 'Неизвестно' }
      }
    },
    levelChangeLabel: {
      sql: `IF(${CUBE.level} <> ${CUBE.prevLevel}, CONCAT(${CUBE.prevLevelLabel}, ' -> ', ${CUBE.levelLabel}), 'Не изменился')`,
      type: `string`
    },
    coefficientDiff: {
      sql: `ROUND(${CUBE.coefficient} - ${CUBE.prevCoefficient}, 2)`,
      type: `number`
    },
    deductionCoefficientDiff: {
      sql: `ROUND(${CUBE.deductionCoefficient} - ${CUBE.prevDeductionCoefficient}, 2)`,
      type: `number`
    },
    
    coefficientTotalLabel: {
      sql: `
        IF(
          ${CUBE.coefficientDiff} <> 0,
          CONCAT(
            IF(${CUBE.coefficientDiff} > 0, '↑', '↓'), 
            ${CUBE.prevCoefficient},
            IF(${CUBE.coefficientDiff} > 0, '+', ''), 
            ${CUBE.coefficientDiff},
            '=', 
            ${CUBE.coefficient}
          ),
          'Не изменился'
        )
      `,
      type: `string`
    },
    deductionCoefficientTotalLabel: {
      sql: `
        IF(
          ${CUBE.deductionCoefficientDiff} != 0,
          CONCAT(
            IF(${CUBE.deductionCoefficientDiff} > 0, '↑', '↓'), 
            ${CUBE.prevDeductionCoefficient}, 
             IF(${CUBE.deductionCoefficientDiff} > 0, '+', ''), 
            ${CUBE.deductionCoefficientDiff},
             '=', 
             ${CUBE.deductionCoefficient}
          ),
          'Не изменился'
        )
      `,
      type: `string`
    }
  }
})