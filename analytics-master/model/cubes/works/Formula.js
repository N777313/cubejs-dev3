cube('Formula', {
  sql: `
    SELECT 
      id,
      expression,
      type
    FROM formula
  `,

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    
    expression: {
      sql: `expression`,
      type: `string`
    }
  }
})