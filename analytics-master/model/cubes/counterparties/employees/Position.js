cube(`Position`, {
  sql: `
    SELECT 
        id,
        name,
        position_type
    FROM position
    `,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    name: {
      sql: `name`,
      type: `string`
    },

    type: {
      sql: `position_type`,
      type: `string`
    },

    positionTypeLabel: {
      type: 'string',
      case: {
        when: [
         {
          sql: `${CUBE.type} = 'DIRECTOR'`,
          label: 'Директор',
        },
        {
          sql: `${CUBE.type} = 'ADMIN'`,
          label: 'Администратор',
        },
        {
          sql: `${CUBE.type} = 'WORKER'`,
          label: 'Рабочий',
        },
        {
          sql: `${CUBE.type} = 'MASTER'`,
          label: 'Прораб',
        },
        {
          sql: `${CUBE.type} = 'PARTNER'`,
          label: 'Партнер',
        },
        {
          sql: `${CUBE.type} = 'SUBCONTRACTOR'`,
          label: 'Субподрядчик',
        },
        {
          sql: `${CUBE.type} = 'PROVIDER'`,
          label: 'Поставщик',
        },
        ]
      }
    }
  }
});
