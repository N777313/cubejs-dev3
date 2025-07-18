cube('ProjectCreatedEvent', {
    extends: Event,
    sql: `
        SELECT pce.*, e.date_created
        FROM project_created_event pce
        LEFT JOIN event e ON pce.id = e.id 
    `,
    sqlAlias: `pce`,

    title: "Событие создания проекта",
    joins: {
        MultiProjects: {
            relationship: `belongsTo`,
            sql: `${ProjectCreatedEvent}.project_id = ${MultiProjects}.id`
        },

        ProjectStatus: {
            relationship: `belongsTo`,
            sql: `${ProjectCreatedEvent.statusId} = ${ProjectStatus.id}`
        }
    },

    measures: {
        countDistinct: {
            sql: `project_id`,
            type: `countDistinct`,
            title: 'Кол-во уникальных'
        }
    },

    dimensions: {
        projectId: {
            primaryKey: true,
            shown: true,
            type: `number`,
            sql: `project_id`
        },
        statusId: {
            type: `string`,
            sql: `status_id`
        },
    },
})