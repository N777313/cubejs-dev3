cube(`CandidateStatus`, {
  sql: `
    SELECT s.*
    FROM candidate_status cs 
    LEFT JOIN ${Status.sql()} s ON s.id = cs.id
  `,
  extends: Status,
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    CandidateStatusGroup: {
      sql: `${CUBE.statusGroupId} = ${CandidateStatusGroup.id}`,
      relationship: `belongsTo`
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    fullName: {
      sql: `CONCAT(${CandidateStatusGroup.name},' - ', ${CUBE.name})`,
      type: `string`
    }
  },
  
  dataSource: `default`
});
