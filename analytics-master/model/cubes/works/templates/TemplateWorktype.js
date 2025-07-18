cube(`TemplateWorktype`, {
  sql: `
    SELECT 
        template_id,
        work_type_id,
        category_id 
    FROM template_worktype
  `,

  joins: {
    Template: {
      sql: `${CUBE.templateId} = ${Template.id}`,
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
    id: {
      // Joins require a primary key, so we'll create one on-the-fly
      sql: `CONCAT(${CUBE.templateId}, ':', ${CUBE.workTypeId}, ':', ${CUBE.categoryId})`,
      type: `string`,
      primaryKey: true,
    },
    workTypeId: {
      sql: `work_type_id`,
      type: `number`
    },
    templateId: {
      sql: `template_id`,
      type: `number`
    },
    categoryId: {
      sql: `category_id`,
      type: `number`
    }
  },
  
  dataSource: `default`
});
