cube(`DocumentSnapshot`, {
  sql: `SELECT * FROM document_snapshot`,
  
  title: "Версия документа",
  joins: {
    Act: {
      sql: `${CUBE}.document_id = ${Act}.id`,
      relationship: `belongsTo`
    },
    User: {
      sql: `${CUBE}.user_id = ${User}.id`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, dateCreated], 
      title: "Кол-во",
    },
    sum: {
      type: `sum`,
      sql: `document_sum`,
      title: "Сумма",
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: "Номер",
    },
    
    documentSum: {
      sql: `document_sum`,
      type: `string`,
      title: "Сумма",
    },
    
    dateCreated: {
      sql: `date_created`,
      type: `time`,
      title: "Дата создания",
    },

    description: {
      sql: `description`,
      type: `string`,
      title: "Описание",
    }
  },
  
  dataSource: `default`
});
