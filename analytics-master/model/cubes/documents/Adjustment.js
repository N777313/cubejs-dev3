cube(`Adjustment`, {
  extends: Documents,
  sql: `
    SELECT 
        d.*, 
        a.user_id
    FROM adjustment a
    LEFT JOIN ${Documents.sql()} d ON a.id = d.id
  `,

  title: "Коректировка",
  
  joins: {
    Operation: {
      sql: `${CUBE.id} = ${Operation.baseDocumentId}`,
      relationship: `hasMany`
    },
    ProjectClientOperation: {
      sql: `${CUBE.id} = ${ProjectClientOperation.baseDocumentId}`,
      relationship: `hasMany`
    },
    EmployeeSalaryOperation: {
      sql: `${CUBE.id} = ${EmployeeSalaryOperation.baseDocumentId}`,
      relationship: `hasMany`
    }
  }

})