cube(`GlobalEntity`, {
  sql: `SELECT * FROM global_entity`,
  
  
  joins: {
    GlobalEntityThread: {
      sql: `${CUBE}.id = ${GlobalEntityThread}.global_entity_id`,
      relationship: `hasMany`
    },
    Counterparty: {
      sql: `${Counterparty}.global_entity_id = ${CUBE}.id`,
      relationship: `hasOne`
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
      type: `string`,
      primaryKey: true,
      shown: true
    },
    
    dateCreated: {
      sql: `${CUBE}.date_created`,
      type: `time`
    },
    
    dateModified: {
      sql: `${CUBE}.date_modified`,
      type: `time`
    },

    typeLabel: {
      sql: `
        CASE
          WHEN ${CUBE}.parent_type = 'counterparty' THEN ${Counterparty.typeLabel}
          WHEN ${CUBE}.parent_type = 'project' THEN "Проект"
          WHEN ${CUBE}.parent_type = 'task' THEN "Задача"
        END
      `,
      type: `string`
    }
  },
  
  dataSource: `default`
});
