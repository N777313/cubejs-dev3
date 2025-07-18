cube('CandidateStatusChangedEvent', {
  extends: Event,
  sql: `
    SELECT e.*, cce.candidate_id, cce.status_id FROM candidate_status_changed_event cce
    LEFT JOIN event e ON e.id = cce.id
    LEFT JOIN candidate_status_changed_event pe ON cce.id = pe.id
  `,

  title: "Событие изменения статуса кандидата",
  joins: {
    Candidate: {
      sql: `${CandidateCreatedEvent}.candidate_id = ${Candidate}.id`,
      relationship: `belongsTo`
    },
    CandidateStatus: {
      sql: `${CandidateStatus}.id = ${CandidateStatusChangedEvent}.status_id`,
      relationship: `belongsTo`
    }
  },

  measures: {
    countDistinct: {
      sql: `candidate_id`,
      type: `countDistinct`,
      title: "Кол-во уникальных",
    },
    countPercentage: {
      sql: ` COUNT(DISTINCT candidate_id) / SUM(count(DISTINCT candidate_id)) over () * 100`,
      type: `number`,
      title: "Процент",
    }
  }
})