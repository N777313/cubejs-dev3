cube('CandidateThread', {
  extends: GlobalEntityThread,

  sql: `
    SELECT gethread.* FROM ${GlobalEntityThread.sql()} gethread
    LEFT JOIN ${GlobalEntity.sql()} ge ON gethread.global_entity_id = ge.id
    WHERE ge.parent_type = 'counterparty'
  `,

  joins: {
    Candidate: {
      sql: `${CUBE.globalEntityId} = ${Candidate.globalEntityId}`,
      relationship: `belongsTo`
    },
    ThreadMessage: {
      sql: `${CUBE.id} = ${ThreadMessage.threadId}`,
      relationship: `hasMany`
    },
  }

})
