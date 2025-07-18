cube('EstimateResponsibleEmployee', {
  extends: UserEmployee,
  title: 'Ответственный сотрудник сметы'
})

cube(`Estimate`, {
  extends: Documents,
  title: 'Смета',

  sql: `
    SELECT 
      d.*, 
      e.sum, 
      e.factor, 
      e.responsible_employee_id,
      ROW_NUMBER() OVER (PARTITION BY project_id, user_id) number_in_project_by_user
    FROM estimate e
    LEFT JOIN ${Documents.sql()} d ON e.id = d.id
    
    `,

  joins: {
    DocumentAuthorUserEmployee: {
      relationship: `hasOne`,
      sql: `${CUBE.userId} = ${DocumentAuthorUserEmployee.userId}`
    },
    WorksContract: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${WorksContract.attachedEstimateId}`
    },
    Works: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Works.documentId}`
    },
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE.projectId} = ${MultiProjects.id}`
    },
    RoomsLayout: {
      sql: `${CUBE.projectId} = ${RoomsLayout.projectId} AND ${RoomsLayout.numberInProjectByDate} = 1`,
      relationship: `hasOne`
    },
    EstimateResponsibleEmployee: {
      sql: `${EstimateResponsibleEmployee}.id = ${Estimate}.responsible_employee_id`,
      relationship: `hasOne`
    },
  },

  segments: {
    contractEstimates: {
      sql: `${Estimate.isContract}`,
      title: 'Сметы к договору'
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: 'Количество'
    },
    commonSum: {
      type: `sum`,
      sql: `sum`,
      format: 'currency',
      title: 'Сумма (всего)'
    },
    maxSum: {
      type: `max`,
      sql: `sum` ,
      title: 'Максимальная сумма'
    },
    avgSum: {
      type: `avg`,
      sql: `sum`,
      title: 'Средняя сумма'
    },
    avgFactor: {
      type: `number`,
      sql: `ROUND(AVG(factor), 2)`,
      title: 'Средний коэффициент'
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: 'Номер'
    },
    
    sum: {
      sql: `sum`,
      type: `number`,
      format: 'currency',
      title: 'Сумма'
    },

    employeeSum: {
      type: `number`,
      sql: `${Works.employeeSalarySum}`,
      subQuery: true,
      title: 'Ожидаемая сумма работникам'
    },

    profit: {
      type: `number`,
      sql: `${Works.profitSum}`,
      subQuery: true,
      title: 'Ожидаемая прибыль'
    },

    sumBySquare: {
      sql: `${CUBE.sum} / ${RoomsLayout.floorSquare}`,
      type: `number`
    },

    factor: {
      sql: `factor`,
      type: `number`,
      title: 'Коэффицент'
    },

    isContract: {
      type: `boolean`,
      sql: `${WorksContract.id} IS NOT NULL`,
      title: 'К договору'
    },

    numberInProjectByUser: {
      type: `number`,
      sql: `number_in_project_by_user`
    },
  }
});

