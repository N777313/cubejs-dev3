cube(`Categories`, {
  sql: `
    SELECT 
        id,
        'order',
        name,
        description,
        parent_category_id,
        operation_expense_id,
        should_use_external_factor 
    FROM category
  `,
  title: "Этап работ",

  joins: {
    WorkTypeCategories: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${WorkTypeCategories.categoryId}`
    },
    CategoriesPath: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${CategoriesPath.categoryId}`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name], 
      title: "Кол-во",
    }
  },

  dimensions: {
    id: {
      sql: `${CUBE}.id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: "Номер",
    },

    order: {
      sql: `order`,
      type: `number`,
      title: "Порядок",
    },
  

    name: {
      sql: `name`,
      type: `string`,
      title: "Название",
    },

    parentId: {
      sql: `parent_category_id`,
      type: `number`,
      title: "Номер родителя",
    },

    shouldUseExternalFactor: {
      sql: `should_use_external_factor`,
      type: `boolean`,
      title: "Использовать КФ на доп работы",
    }
  }
});