cube("EmployeesTags", {
  sql: `SELECT e.id, GROUP_CONCAT(t.name ORDER BY t.name ASC SEPARATOR ', ') as tags 
    FROM ${Employees.sql()} e
    LEFT JOIN tag_global_entity tge ON tge.global_entity_id = e.global_entity_id
    LEFT JOIN tag t ON t.id = tge.tag_id
    GROUP BY e.id
  `,

  dimensions: {
    tags: {
      sql: 'tags',
      type: 'string'
    }
  },

  preAggregations: {
      main: {
        type: `originalSql`,
      }
  }
})

cube(`Employees`, {
  sql: `
    SELECT 
        c.*, 
        e.description,
        e.position_id,
        e.recruitment_date 
    FROM employees e
    LEFT JOIN ${Counterparty.sql()} c ON e.id = c.id
`,
  extends: Counterparty,

  title: "Сотрудник",

  joins: {
    Position: {
      relationship: `belongsTo`,
      sql: `${CUBE.positionId} = ${Position.id}`
    },
    Salary: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${Salary.employeeId}`
    },
    CurrentPieceWorkSalaries: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${CurrentPieceWorkSalaries.employeeId}`
    },
    DismissalInfo: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${DismissalInfo.employeeId}`
    },
    EmployeesTags: {
      relationship: 'hasOne',
      sql: `${CUBE.id} = ${EmployeesTags}.id`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, secondName]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    coefficient: {
      sql: `${CurrentPieceWorkSalaries.coefficient}`,
      type: `number`,
      title: "Текущий коэффициент"
    },

    level: {
      sql: `${CurrentPieceWorkSalaries.level}`,
      type: `string`,
      title: "Уровень"
    },

    levelLabel: {
      type: `string`,
      sql: `${CurrentPieceWorkSalaries.levelLabel}`
    },
    description: {
      sql: `description`,
      type: `string`,
      title: "Описание"
    },

    isActive: {
      sql: `${DismissalInfo.id} IS NULL`,
      type: `boolean`,
      title: "Уволен"
    },

    recruitmentDate: {
      sql: `recruitment_date`,
      type: `time`,
      title: "Дата найма"
    },

    term: {
      sql: `DATEDIFF(CURDATE(), ${CUBE.recruitmentDate})`,
      type: `number`,
      title: "Срок работы"
    },

    termGroup: {
      type: `string`,
      sql: `IF(${CUBE.term} < 30, CONCAT(ROUND(${CUBE.term} / 7), ' нед.'), CONCAT(ROUND(${CUBE.term} / 30), ' мес.'))`
    },

    projectCountGroup: {
      type: `number`,
      sql: `${MultiProjects.count}`,
      subQuery: true,
      title: "Кол-во закрепленных проектов"
    },

    positionId: {
      sql: `position_id`,
      type: `number`
    },

    positionName: {
      sql: `${Position.name}`,
      type: `string`,
      title: "Должность"
    }
  }
});
