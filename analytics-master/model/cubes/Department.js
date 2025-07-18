cube(`Department`, {
  sql: `SELECT * FROM department`,

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
    },
    name: {
      sql: `name`,
      type: `string`,
    },
  },
});
