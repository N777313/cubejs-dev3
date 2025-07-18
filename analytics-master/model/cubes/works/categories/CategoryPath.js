import {treeCte} from '../utils'

cube('CategoriesPath', {
  sql: `
  SELECT id categoryId, name, parent_category_id, path 
  FROM (
    ${treeCte('category', 'id', 'parent_category_id', 'name')}
  ) category_tree
  `,
  title: "Дерево этапов",

  dimensions: {
    categoryId: {
      sql: `categoryId`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: "Номер этапа",
    },
    path: {
      sql: `path`,
      type: `string`,
      title: "Ветка этапа",
    },
    root: {
      type: `string`,
      sql: `SUBSTRING_INDEX(${CategoriesPath.path}, ',',1)`,
      title: "Корень этапа",
    },
  }
})