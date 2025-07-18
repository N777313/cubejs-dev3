cube(`PieceWorkSalary`, {
  extends: Salary,

  sql: `
    SELECT 
        s.*,
        pws.level,
        pws.coefficient,
        pws.deduction_coefficient,
        pws.salary_source
    FROM piece_work_salary pws
    LEFT JOIN ${Salary.sql()} s ON s.salary_id = pws.id
  `,

  joins: {
    Employees: {
      relationship: `belongsTo`,
      sql: `${CUBE}.employee_id = ${Employees.id}`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },
    avgCoefficient: {
      type: `avg`,
      sql: `coefficient`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    coefficient: {
      sql: `coefficient`,
      type: `number`
    },

    deductionCoefficient: {
      sql: `deduction_coefficient`,
      type: `number`
    },

    level: {
      sql: `level`,
      type: `string`
    },

    levelLabel: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.level} = 'beginner'`, label: 'Новичок' },
          { sql: `${CUBE.level} = 'master'`, label: 'Мастер' },
          { sql: `${CUBE.level} = 'expert'`, label: 'Эксперт' },
        ],
        else: { label: 'Неизвестно' }
      }
    }
  }
});
