cube('ProjectThread', {
  extends: GlobalEntityThread,

  sql: `
    SELECT gethread.* 
    FROM ${GlobalEntityThread.sql()} gethread
    LEFT JOIN ${GlobalEntity.sql()} ge ON gethread.global_entity_id = ge.id
    WHERE ge.parent_type = 'project'
  `,

  joins: {
    MultiProjects: {
      sql: `${CUBE.globalEntityId} = ${MultiProjects.globalEntityId}`,
      relationship: `belongsTo`
    },
    ThreadMessage: {
      sql: `${CUBE.id} = ${ThreadMessage.threadId}`,
      relationship: `hasMany`
    },
  }

})
