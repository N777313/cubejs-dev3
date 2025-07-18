cube(`Candidate`, {
  sql: `
    SELECT 
        c.*, 
        candidate.description,
        candidate.date_added,
        candidate.candidate_status_id 
    FROM candidate candidate
    LEFT JOIN (${Counterparty.sql()}) c ON candidate.id = c.id
`,
  extends: Counterparty,

  title: "Кандидат",

  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    CandidateStatus: {
      sql: `${CUBE.candidateStatusId} = ${CandidateStatus.id}`,
      relationship: `belongsTo`
    },
    Task: {
      sql: `${CUBE.globalEntityId} = ${Task.targetGlobalEntityId}`,
      relationship: `hasMany`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, dateAdded]
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

    description: {
      sql: `description`,
      type: `string`,
      title: 'Описание'
    },
    
    dateAdded: {
      sql: `date_added`,
      type: `time`,
      title: 'Дата добавления'
    },

    taskCountRemaining: {
      sql: `${Task.countRemaining}`,
      subQuery: true,
      type: `number`
    },

    candidateStatusId: {
      sql: `candidate_status_id`,
      type: `number`
    }

  },
  
  dataSource: `default`
});
