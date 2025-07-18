cube('TaskAuthorUserEmployee', {
  extends: UserEmployee,
})

cube('TaskResponsibleUserEmployee', {
  extends: UserEmployee,
})

cube(`Task`, {
  sql: `
    SELECT 
     t.id,
     t.name,
     t.description,
     t.status,
     t.priority,
     t.result,
     t.user_id,
     t.author_user_id,
     t.task_template_id,
     t.plan_date,
     t.execution_date,
     t.rating,
     t.document_id,
     t.global_entity_id,
     t.target_global_entity_id,
     t.expected_completion_date,
     ge.date_created,
     ge.date_modified 
    FROM task t 
    LEFT JOIN global_entity ge ON t.global_entity_id = ge.id`,

  joins: {
    TaskResponsibleUserEmployee: {
      sql: `${Task}.user_id = ${TaskResponsibleUserEmployee}.user_id`,
      relationship: `belongsTo`
    },

    TaskAuthorUserEmployee: {
      sql: `${Task}.author_user_id = ${TaskAuthorUserEmployee}.user_id`,
      relationship: `belongsTo`
    },

    TaskTemplate: {
      sql: `${Task}.task_template_id = ${TaskTemplate}.id`,
      relationship: `belongsTo`
    },
    MultiProjects: {
      sql: `${Task}.target_global_entity_id = ${MultiProjects}.global_entity_id`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, dateCreated, dateModified, planDate, executionDate],
    },

    countRemaining: {
      type: `count`,
      filters: [{
         sql: `${Task.executionDate} IS NULL`
      }],
    },

    countRemainingNotExpired: {
      type: `count`,
      filters: [{
        sql: `${Task.executionDate} IS NULL AND ${Task.planDate} > NOW()`
      }]
    },

    countCompleted: {
      type: `count`,
      filters: [{
        sql: `${Task.isCompleted}`
      }]
    },

    countExpired: {
      type: `count`,
      filters: [{
        sql: `${Task.isExpired}`
      }]
    },

    countSuccess: {
      type: `count`,
      filters: [{
        sql: `${Task.isSuccess}`
      }]
    },

    countFailed: {
      type: `count`,
      filters: [{
        sql: `${Task.isFailed}`
      }]
    },

    avgExpiredTime: {
      type: `avg`,
      sql: `${Task.expiredTime}`,
      filters: [{
        sql: `${Task.isExpired}`
      }]
    },

    avgLeadTime: {
      type: `avg`,
      sql: `${Task.leadTime}`,
    },

    countWithoutRating: {
      type: `count`,
      filters: [{
        sql: `${Task.rating} IS NULL`
      }]
    },

    avgRating: {
      type: `avg`,
      sql: `${Task.rating}`,
    },

    dateCreatedMax: {
      type: `max`,
      sql: `date_created`,
      meta: {
        type: 'time'
      },
      title: 'Последняя дата создания'
    },
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: 'Номер'
    },
    userId: {
      sql: `user_id`,
      type: `number`
    },
    authorUserId: {
      sql: `author_user_id`,
      type: `number`
    },
    name: {
      sql: `name`,
      type: `string`,
      title: 'Название'
    },
    
    description: {
      sql: `description`,
      type: `string`
    },
    
    result: {
      sql: `result`,
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
    
    planDate: {
      sql: `plan_date`,
      type: `time`
    },
    
    executionDate: {
      sql: `execution_date`,
      type: `time`
    },

    expiredTime: {
      type: `number`,
      sql: `IF(execution_date IS NOT NULL, TIMESTAMPDIFF(HOUR, plan_date, execution_date), NULL)`
    },

    leadTime: {
      type: `number`,
      sql: `TIMESTAMPDIFF(HOUR, ${CUBE.dateCreated}, IFNULL(execution_date, CURRENT_DATE()))`
    },

    status: {
      sql: `status`,
      type: `string`
    },

    isExpired: {
      sql: `IFNULL(${Task.executionDate}, NOW()) > ${Task.planDate}`,
      type: `boolean`
    },

    isExpiredLabel: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.isExpired}`, label: 'Просрочено' },
        ],
        else: { label: `Выполняется` }
      }
    },

    isCompleted: {
      sql: `${Task.status} != 'pending'`,
      type: `boolean`,
      title: 'Выполнена'
    },

    isSuccess: {
      sql: `${Task.status} = 'success'`,
      type: `boolean`
    },

    isFailed: {
      sql: `${Task.status} = 'failed'`,
      type: `boolean`
    },

    rating: {
      sql: `rating`,
      type: `number`
    },

    authorInitials: {
      sql: `IFNULL(${TaskAuthorUserEmployee.initials}, IFNULL(${TaskAuthorUserEmployee.userName}, 'СИСТЕМА'))`,
      type: `string`
    },

    responsibleInitials: {
      sql: `IFNULL(${TaskResponsibleUserEmployee.initials}, ${TaskResponsibleUserEmployee.userName})`,
      type: `string`
    },

    targetGlobalEntityId: {
      sql: `target_global_entity_id`,
      type: `number`
    }

  }
});
