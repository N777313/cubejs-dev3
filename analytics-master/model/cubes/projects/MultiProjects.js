cube(`MultiProjects`, {
  sql: `
    SELECT 
        p.id, 
        p.name,
        p.project_status_id,
        p.client_id,
        p.global_entity_id,
        p.responsible_user_id,
        p.sum,
        ge.date_created 
    FROM project p
    LEFT JOIN global_entity ge ON p.global_entity_id = ge.id 
  `,

  extends: GlobalEntity,

  joins: {
    Documents: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Documents.projectId}`
    },
    Estimate: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Estimate.projectId}`
    },
    Act: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Act.projectId}`
    },
    Contract: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Contract.projectId}`
    },
    ProjectEmployee: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${ProjectEmployee.projectId}`
    },
    ProjectResponsible: {
      relationship: `belongsTo`,
      sql: `${CUBE.responsibleUserId} = ${ProjectResponsible.userId}`
    },
    ProjectStatus: {
      relationship: `belongsTo`,
      sql: `${CUBE.statusId} = ${ProjectStatus.id}`
    },
    ProjectThread: {
      relationship: `hasMany`,
      sql: `${CUBE.globalEntityId} = ${ProjectThread.globalEntityId}`
    },
    ClientForm: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${ClientForm.projectId}`
    },
    ProjectStatusChangeEvent: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${ProjectStatusChangeEvent.projectId}`
    },
    ProjectStatusesPath: {
      relationship: `hasOne`,
      sql: ` ${CUBE.id} = ${ProjectStatusesPath.projectId}`
    },
    AggEstimate: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${AggEstimate.projectId}`
    }
  },  
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    },

    hasEstimateCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.hasEstimate}`
        }
      ]
    },

    hasNoContractCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.hasContract} IS NULL`
        }
      ]
    },
    
    hasConfirmedActCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.hasConfirmedAct}`
        }
      ]
    },
    
    hasContractWithNoActCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.hasContract}`
        },
        {
          sql: `${CUBE.hasConfirmedAct} IS NULL`
        }
      ]
    },

    conversionRate: {
      type: `number`,
      sql: `
        ${CUBE.hasConfirmedActCount} / ${CUBE.hasEstimateCount}
      `
    },

    hasNoActCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.hasConfirmedAct} IS NULL`
        }
      ]
    },
    inWorkCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.fullStatusName} LIKE '%В работе%'`
        }
      ]

    },
    salesFunnelCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE.fullStatusName} LIKE '%Воронка продаж%'`
        }
      ]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: 'Название'
    },

    statusId: {
      sql: `project_status_id`,
      type: `number`
    },

    clientFactor: {
      type: `number`,
      sql: `${Estimate.avgFactor}`,
      subQuery: true
    },

    clientId: {
      type: `number`,
      sql: `client_id`
    },

    fullStatusName: {
      type: `string`,
      sql: `CONCAT(${ProjectStatusGroup.name},' - ', ${ProjectStatus.name})`
    },

    startDate: {
      sql: `${Documents.minActDocumentDate}`,
      type: `time`,
      subQuery: true
    },

    globalEntityId: {
      sql: `global_entity_id`,
      type: `string`
    },

    responsibleUserId: {
      sql: `responsible_user_id`,
      type: `number`
    },

    hasEstimate: {
      type: `boolean`,
      sql: `${Estimate.count} > 0`,
      subQuery: true
    },

    hasContract: {
      type: `boolean`,
      sql: `${Contract.count} > 0`,
      subQuery: true
    },

    hasConfirmedAct: {
      type: `boolean`,
      sql: `${Act.confirmedCount} > 0`,
      subQuery: true
    },

  }
  
});
