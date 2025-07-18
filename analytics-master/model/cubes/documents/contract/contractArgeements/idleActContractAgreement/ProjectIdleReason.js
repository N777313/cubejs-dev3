import {treeCte} from '../utils'

cube("ProjectIdleReason", {
  sql: `
    SELECT pir.*, pir_tree.path FROM project_idle_reason pir
    LEFT JOIN (${treeCte('project_idle_reason', 'id', 'parent_id', 'name')}) pir_tree ON pir_tree.id = pir.id
    `,

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },
    name: {
      sql: `name`,
      type: `string`
    },
    path: {
      sql: `path`,
      type: `string`
    }
  }
})