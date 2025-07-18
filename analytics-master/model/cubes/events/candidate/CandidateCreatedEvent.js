cube('CandidateCreatedEvent', {
  extends: Event,
  sql: `
    SELECT e.*, cce.candidate_id FROM candidate_created_event cce
    LEFT JOIN event e ON e.id = cce.id
  `,

  title: "Событие создание кандидата",
  joins: {
    Candidate: {
      sql: `${CandidateCreatedEvent}.candidate_id = ${Candidate}.id`,
      relationship: `belongsTo`
    }
  }
})