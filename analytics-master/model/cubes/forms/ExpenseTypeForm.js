const {query} = require("../fetch");
const {createJoin, createValue, createDimension} = require('../formSqlGeneration')

asyncModule(async () => {
  const fields = (await query(`
    SELECT id,name FROM form_item_template
    WHERE entity_type = 'operation_expense'
   `));

  cube(`ExpenseTypeForm`, {
    sql: `
      SELECT
        operation_expense_id,
        ${fields.map(createValue).join(',')}
      FROM operation_expense_form
      ${fields.map(f=> createJoin(f, 'operation_expense_form')).join('')}
    `,

    title: "Форма статьи",

    joins: {

    },

    measures: {},

    dimensions: fields.reduce(
        (all, field, index) => ({
          ...all,
          ...createDimension(field, index),
        }),
        {
          operationExpenseId: {
            sql: `operation_expense_id`,
            type: `number`
          }
        }
    ),

    preAggregations: {
      main: {
        type: `originalSql`,
      }
    }
  });
});
