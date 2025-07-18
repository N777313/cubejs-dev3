cube('ThreadMessageReactionAuthor', {
  extends: UserEmployee,
})

cube(`ThreadMessageReaction`, {
  sql: `
    SELECT 
        id, 
        user_id,
        message_id,
        type 
    FROM thread_message_reaction
    `,
  
  joins: {
    ThreadMessage: {
      sql: `${CUBE.messageId} = ${ThreadMessage.id}`,
      relationship: `belongsTo`
    },
    ThreadMessageReactionAuthor: {
      sql: `${CUBE.userId} = ${ThreadMessageReactionAuthor.userId}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },
    countDistinct: {
      sql: `message_id`,
      type: `countDistinct`,
      title: 'Кол -во уникальных'
    },
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    type: {
      sql: `type`,
      type: `string`
    },

    messageId: {
      sql: `message_id`,
      type: `number`
    },

    userId: {
      sql: `user_id`,
      type: `number`
    }
  },
  
  dataSource: `default`
});
