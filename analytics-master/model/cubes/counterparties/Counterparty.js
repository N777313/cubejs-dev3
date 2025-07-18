cube(`Counterparty`, {
  extends: GlobalEntity,

  sql: `
    SELECT 
      c.email,
      c.global_entity_id,
      c.type counterparty_type, 
      np.*, 
      ge.date_created,
      ge.date_modified
    FROM counterparty c
    LEFT JOIN global_entity ge ON ge.id = c.global_entity_id
    LEFT JOIN natural_person np ON np.id = c.id
  `,

  title: "Контрагент",
  
  joins: {
    PhoneNumber: {
      relationship: 'hasMany',
      sql: `${CUBE}.id = ${PhoneNumber}.base_counterparty`
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, secondName, passportDate]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    name: {
      sql: `${CUBE}.name`,
      type: `string`,
      title: "Имя"
    },
    
    passportNumber: {
      sql: `${CUBE}.passport_number`,
      type: `string`,
      title: "Номер паспорта"
    },
    
    passportOrigin: {
      sql: `${CUBE}.passport_origin`,
      type: `string`,
    },
    
    passportRegistration: {
      sql: `${CUBE}.passport_registration`,
      type: `string`
    },
    
    patronymic: {
      sql: `${CUBE}.patronymic`,
      type: `string`,
      title: "Отчество"
    },
    
    secondName: {
      sql: `${CUBE}.second_name`,
      type: `string`,
      title: "Фамилия"
    },
    
    passportDate: {
      sql: `${CUBE}.passport_date`,
      type: `time`
    },

    initials: {
      sql: `
        CONCAT(${CUBE.secondName}, ' ',
        LEFT(${CUBE.name}, 1), '.',
        LEFT(${CUBE.patronymic},1)
      )`,
      type: `string`,
      title: "Инициалы"
    },

    nameInitials: {
      sql: `
        CONCAT(${CUBE.name}, ' ',
        LEFT(${CUBE.secondName}, 1), '.',
        LEFT(${CUBE.patronymic},1)
      )`,
      type: `string`,
      title: "Инициалы"
    },

    typeLabel: {
      type: `string`,
      sql: `
        CASE
          WHEN ${CUBE}.counterparty_type = 'natural_persion' OR ${CUBE}.counterparty_type = 'legal_person' THEN "Клиент"
          WHEN ${CUBE}.counterparty_type = 'employee' THEN "Сотрудник"
          WHEN ${CUBE}.counterparty_type = 'candidate' THEN "Кандидат"
        END
      `,
    },

    globalEntityId: {
      sql: `global_entity_id`,
      type: `number`
    }
  }
});
