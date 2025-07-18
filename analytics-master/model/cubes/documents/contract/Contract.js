cube(`Contract`, {
  extends: Documents,
  title: 'Договор',

  sql: `
    SELECT d.*, c.address
    FROM contract c
    LEFT JOIN document d ON c.id = d.id
  `,

  joins: {
    DiscountContractAgreement: {
      sql: `${CUBE.id} = ${DiscountContractAgreement.contractId}`,
      relationship: `hasOne`
    },
    MultiProjects: {
      sql: `${CUBE.projectId} = ${MultiProjects.id}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: 'Количество'
    },
    countConfirmed: {
      type: `count`,
      filters: [{
        sql: `${CUBE.isConfirmed}`
      }],
      title: 'Количество подтвержденных'
    },
    discountSum: {
      type: `sum`,
      sql: `discount`,
      title: 'Сумма скидок',
      format: 'currency'
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: 'Номер'
    },
    
    address: {
      sql: `address`,
      type: `string`,
      title: 'Адрес'
    },

    fullName: {
      sql: `CONCAT(${CUBE.typeLabel}, ' от ' , DATE_FORMAT(${CUBE.documentDate},  '%e.%m.%y'))`,
      type: `string`,
      title: 'Название'
    },

    typeLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE.type} = 'materials_contract'`, label: 'Материалы'},
          {sql: `${CUBE.type} = 'works_contract'`, label: 'Работы'},
          {sql: `${CUBE.type} = 'design_contract'`, label: 'Дизайн'},
        ],
      },
      title: 'Тип'
    },
  }
});