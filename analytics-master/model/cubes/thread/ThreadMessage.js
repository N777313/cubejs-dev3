cube('ThreadMessageAuthorUserEmployee', {
  extends: UserEmployee,
})

cube(`ThreadMessage`, {
  sql: `
    SELECT 
        id,
        content,
        user_id,
        date_created,
        date_modified,
        thread_id,
        related_message_id 
    FROM thread_message`,
  
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    ThreadMessageAuthorUserEmployee: {
      sql: `${CUBE}.user_id = ${ThreadMessageAuthorUserEmployee}.user_id`,
      relationship: `belongsTo`
    },
    ThreadMessageReaction: {
      sql: `${CUBE}.id = ${ThreadMessageReaction}.message_id`,
      relationship: `hasMany`
    },
    ProjectThread: {
      sql: `${CUBE}.thread_id = ${ProjectThread}.id`,
      relationship: `belongsTo`
    },
    EmployeeThread: {
      sql: `${CUBE}.thread_id = ${EmployeeThread}.id`,
      relationship: `belongsTo`
    },
    CandidateThread: {
      sql: `${CUBE}.thread_id = ${CandidateThread}.id`,
      relationship: `belongsTo`
    },
    ImageAttachment: {
      sql: `${ThreadMessage}.id = ${ImageAttachment}.thread_message_id`,
      relationship: `hasMany`
    },
    GlobalEntityThread: {
      sql: `${GlobalEntityThread}.id = ${CUBE}.thread_id`,
      relationship: `hasMany`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, dateCreated, dateModified]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    content: {
      sql: `content`,
      type: `string`
    },
    
    dateCreated: {
      sql: `date_created`,
      type: `time`
    },
    
    dateModified: {
      sql: `date_modified`,
      type: `time`
    },

    threadId: {
      sql: `thread_id`,
      type: `number`
    }
  },
  
  dataSource: `default`
});
