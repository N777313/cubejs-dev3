import {treeCte} from '../utils'

cube('OperationExpensePath', {
  sql: `
  SELECT id, name, parent_id, path
  FROM (
    ${treeCte('operation_expense', 'id', 'parent_id', 'name')}
  ) oe_tree
  `,
  title: "Дерево статей учета",
  dimensions: {
    operationExpenseId: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: "№",
    },
    path: {
      sql: `path`,
      type: `string`,
      title: "Ветка",
    },
    root: {
      type: `string`,
      sql: `SUBSTRING_INDEX(${OperationExpensePath.path}, ',',1)`,
      title: "Корень",
    }
  },

  // preAggregations: {
  //   main: {
  //     type: `originalSql`
  //   }
  // }
})