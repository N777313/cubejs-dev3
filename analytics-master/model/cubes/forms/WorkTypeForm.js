const {query} = require("../fetch");
const {createJoin, createValue, createDimension} = require('../formSqlGeneration')

asyncModule(async () => {
  const fields = (await query(`
    SELECT id,name FROM form_item_template
    WHERE entity_type = 'work_type'
   `));

  cube(`WorkTypeForm`, {
    sql: `
      SELECT
        work_type_id,
        ${fields.map(createValue).join(',')}
      FROM work_type_form
      ${fields.map(f=> createJoin(f, 'work_type_form')).join('')}
    `,

    title: "Форма типа работ",

    dimensions: fields.reduce(
        (all, field, index) => ({
          ...all,
          ...createDimension(field, index),
        }),
        {
          workTypeId: {
            sql: `work_type_id`,
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
