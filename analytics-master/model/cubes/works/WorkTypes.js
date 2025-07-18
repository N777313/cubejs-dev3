cube(`WorkTypes`, {
  extends: GlobalEntity,
  sql: `
    SELECT 
        ge.date_created,
        wt.id,
        wt.name,
        wt.price,
        wt.salary,
        wt.description,
        wt.formula_id
    FROM work_type wt
    LEFT JOIN ${GlobalEntity.sql()} ge ON ge.id = wt.global_entity_id
    `,
  title: 'Типы работ',

  joins: {
    WorkTypeCategories: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${WorkTypeCategories.workTypeId}`
    },
    TemplateWorktype: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${TemplateWorktype}.work_type_id`
    },
    WorkTypeForm: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${WorkTypeForm.workTypeId}`
    },
    Formula: {
      relationship: `hasOne`,
      sql: `${CUBE}.formula_id = ${Formula}.id`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name],
      title: 'Количество'
    },
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: 'Номер'
    },

    name: {
      sql: `name`,
      type: `string`,
      title: 'Название'
    },
    
    priceValue: {
      sql: `price`,
      type: `string`,
      title: 'Цена'
    },
    
    salary: {
      sql: `salary`,
      type: `string`,
      title: 'Зарплата'
    },

    profitability: {
      sql: `1 - (${CUBE.salary} / ${CUBE.priceValue})`,
      type: `number`
    },
    
    description: {
      sql: `description`,
      type: `string`,
      title: 'Описание'
    },
  }
});
