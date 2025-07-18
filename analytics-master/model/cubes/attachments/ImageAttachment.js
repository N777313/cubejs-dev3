cube(`ImageAttachment`, {
  extends: Attachment,
  sql: `
    SELECT a.* FROM image_attachment ia
    LEFT JOIN attachment a ON ia.id = a.id
  `, 
  title: "Изображение", 

  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started
  },

  joins: {
    ThreadMessage: {
      sql: `${ThreadMessage}.id = ${ImageAttachment}.thread_message_id`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, dateCreated], 
      title: "Кол-во"
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: "Номер"
    },
  },

  dataSource: `default`
});
