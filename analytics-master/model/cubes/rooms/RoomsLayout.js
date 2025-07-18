cube('RoomsLayout', {
  sql: `
    SELECT 
        id,
        name,
        project_id,
        layout_date,
        ROW_NUMBER() over (PARTITION BY project_id ORDER BY layout_date) number_in_project_by_date
    FROM rooms_layout
  `,

  joins: {
    MultiProjects: {
      sql: `${CUBE.projectId} = ${MultiProjects.id}`,
      relationship: `belongsTo`
    },
    RoomsVersion: {
      sql: `${CUBE.id} = ${RoomsVersion.roomLayoutId}`,
      relationship: `hasMany`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    numberInProjectByDate: {
      sql: `number_in_project_by_date`,
      type: `number`
    },

    projectId: {
      sql: `project_id`,
      type: `number`
    },

    layoutDate: {
      sql: `layout_date`,
      type: `time`
    },

    floorSquare: {
      sql: `${RoomsVersion.floorSquareSum}`,
      type: `number`,
      subQuery: true
    },

    roomCount: {
      sql: `${RoomsVersion.count}`,
      type: `number`,
      subQuery: true
    }
  }

})