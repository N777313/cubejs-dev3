cube(`ProjectStatus`, {
  sql: `
    SELECT 
        s.*
    FROM project_status ps 
    LEFT JOIN ${Status.sql()} s ON s.id = ps.id`,

  extends: Status,

  sqlAlias: 'projectStatus',

  joins: {
    ProjectStatusGroup: {
      sql: `${CUBE.statusGroupId} = ${ProjectStatusGroup.id}`,
      relationship: `belongsTo`
    },
  },
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    }
  },
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    fullName: {
      sql: `CONCAT(${ProjectStatusGroup.name},' - ', ${CUBE.name})`,
      type: `string`
    },
    
    statusTypeLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `status_type = 'default'`, label: 'В процессе'},
          {sql: `status_type = 'success'`, label: 'Успешно'},
          {sql: `status_type = 'fail'`, label: 'Провален'},
        ],
      },
    }
  },

  preAggregations: {
    rollup: {
      type: `rollup`,
      external: true,
      dimensionReferences: [ProjectStatus.id, ProjectStatus.name]
    },
  }
});
