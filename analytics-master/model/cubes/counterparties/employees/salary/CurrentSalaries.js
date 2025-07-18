cube('CurrentPieceWorkSalaries', {
  sql: `
    SELECT pws.* 
    FROM ${PieceWorkSalary.sql()} pws
    WHERE desc_order_employee_date = 1
  `,
  extends: PieceWorkSalary,
})