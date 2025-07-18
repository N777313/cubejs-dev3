const {query} = require("../fetch");
const {createJoin, createValue, createDimension} = require('../formSqlGeneration')

asyncModule(async () => {
  const fields = (await query(`
    SELECT id,name FROM form_item_template
    WHERE entity_type = 'project'
   `)) ?? [];

  cube(`ClientForm`, {
    sql: `
      SELECT
        ${['project_id', ...fields.map(createValue)].join(',')}
      FROM client_form
      ${fields.map(f=> createJoin(f, 'client_form')).join('')}
    `,

    title: "Форма клиента",

    dimensions: fields.reduce(
        (all, field, index) => ({
          ...all,
          ...createDimension(field, index),
        }),
        {
          projectId: {
            sql: `project_id`,
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
