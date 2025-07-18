cube(`WorkTypeCategories`, {
  sql: `SELECT * FROM work_type_category`,
  
  joins: {
    Categories: {
      sql: `${CUBE.categoryId} = ${Categories.id}`,
      relationship: `belongsTo`
    },
    WorkTypes: {
      sql: `${CUBE.workTypeId} = ${WorkTypes.id}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: []
    }
  },
  
  dimensions: {
    workTypeId: {
      sql: `work_type_id`,
      type: `number`,
      primaryKey: true
    },
    categoryId: {
      sql: `category_id`,
      type: `number`,
      primaryKey: true
    }
  }
});
