cube(`ActivityDirection`, {
  sql: `SELECT id, name, type FROM activity_direction`,

  joins: {
    ManagementOperation: {
      relationship: `hasMany`,
      sql: `${ManagementOperation}.activity_direction_id = ${ActivityDirection}.id`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, type]
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    name: {
      sql: `name`,
      type: `string`
    },

    type: {
      sql: `name`,
      type: `string`
    }
  }
});
