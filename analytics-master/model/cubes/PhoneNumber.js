cube(`PhoneNumber`, {
  sql: `SELECT * FROM phone_number`,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    phone: {
      sql: `phone`,
      type: `string`
    }
  },
  
  dataSource: `default`
});

cube(`CounterpartyPhoneNumbers`, {
  sql: `SELECT p.id, GROUP_CONCAT(p.phone ORDER BY p.phone ASC SEPARATOR ', ') as phone_numbers 
    FROM phone_number p
    GROUP BY p.id
  `,

  dimensions: {
    phoneNumbers: {
      sql: 'phone_numbers',
      type: 'string'
    }
  }
})