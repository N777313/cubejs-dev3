cube('Event', {
    sql: `SELECT * FROM event`,
    title: "Событие",
    joins: {

    },

    measures: {
        count: {
            type: `count`,
            drillMembers: [id],
            title: 'Количество'
        },
    },

    dimensions: {
        id: {
            type: `string`,
            sql: `${CUBE}.id`,
            primaryKey: true,
            shown: true,
            title: "Номер",
        },
        dateCreated: {
            type: `time`,
            sql: `${CUBE}.date_created`,
            title: "Дата создания",
        },
        userId: {
            type: `number`,
            sql: `${CUBE}.user_id`,
            title: "Номер пользователя",
        },
        type: {
            type: `string`,
            sql: `${CUBE}.type`,
            title: "Тип",
        },
    }
})
