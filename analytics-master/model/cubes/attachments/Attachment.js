cube(`Attachment`, {
  sql: `SELECT * FROM attachment`,
  title: "Файлы",

  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
    ThreadMessage: {
      sql: `${ThreadMessage}.id = ${CUBE}.thread_message_id`,
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
    
    dateCreated: {
      sql: `date_created`,
      type: `time`,
      title: "Дата создания"
    }
  },
  
  dataSource: `default`
});
