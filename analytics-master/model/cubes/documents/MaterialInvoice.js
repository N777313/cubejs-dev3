cube('MaterialInvoice', {
  extends: Documents,
  sql: `
    SELECT
      d.*,
      mi.sum
    FROM materials_invoice mi
    LEFT JOIN ${Documents.sql()} d ON mi.id = d.id
  `,
  title: "Накладная на материалы",

  joins: {

  },

  dimensions: {
    sum: {
      sql: `sum`,
      type: `number`
    }
  }
})
