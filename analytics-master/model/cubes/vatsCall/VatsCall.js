const FILTER_CANDIDATE_DUPLICATES_SQL = `
  SELECT * FROM (
    SELECT phone,
          counterparty_id,
          c.type, ROW_NUMBER() over (PARTITION BY phone ORDER BY c.type) rn_counterparty_type
    FROM phone_number
    LEFT join counterparty c on phone_number.counterparty_id = c.id
  ) phone_with_counterparty_type_order
  WHERE rn_counterparty_type = 1
`

cube(`VatsCall`, {
  // телефон дублируется для кандидатов
  sql: `
    SELECT vc.*, 
      pni.counterparty_id income_counterparty_id,
      pno.counterparty_id outcome_counterparty_id
    FROM vats_call vc
    LEFT JOIN phone_number pni ON pni.phone = vc.employee_phone 
    LEFT JOIN (${FILTER_CANDIDATE_DUPLICATES_SQL}) pno ON pno.phone = vc.client_phone
  `,

  title: "Звонки",

  joins: {
    Candidate: {
      relationship: `belongsTo`,
      sql: `${CUBE.outcomeCounterpartyId} = ${Candidate.id}`
    },
    Employees: {
      relationship: `belongsTo`,
      sql: `${CUBE.outcomeCounterpartyId} = ${Employees.id}`
    },
    VatsCallInternalEmployee: {
      relationship: `belongsTo`,
      sql: `${CUBE.incomeCounterpartyId} = ${VatsCallInternalEmployee.id}`
    },
    Client: {
      relationship: `belongsTo`,
      sql: `${CUBE.outcomeCounterpartyId} = ${Client.id}`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, callId, startDate]
    },
    countIncome: {
      title: 'Кол-во входящих',
      type: `count`,
      filters: [{
        sql: `${CUBE.type} = 'income'`
      }]
    },
    countOutcome: {
      title: 'Кол-во исходящих',
      type: `count`,
      filters: [{
        sql: `${CUBE.type} = 'outcome'`
      }]
    },
    countMissed: {
      title: 'Кол-во пропущенных',
      type: `count`,
      filters: [{
        sql: `${CUBE.status} = 'missed'`
      }]
    },
    avgDuration: {
      type: `avg`,
      sql: `duration`,
      title: "Средняя длительность"
    }
  },
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    type: {
      sql: `type`,
      type: `string`,
    },
    typeLabel: {
      type: `string`,
      case: {
        when: [{
          sql: `${CUBE.type} = 'income'`,
          label: 'Входящий'
        }, {
          sql: `${CUBE.type} = 'outcome'`,
          label: 'Исходящий'
        }]
      },
      title: "Тип"
    },
    clientPhone: {
      sql: `client_phone`,
      type: `string`,
      title: "Внешний АТС номер"
    },
    clientName: {
      sql: `
        COALESCE(
          CONCAT("Сотрудник ",${Employees.initials}), 
          CONCAT("Проект  ",${MultiProjects.name}), 
          CONCAT("Кандидат ",  ${Candidate.initials}),
          "Номера нет в базе"  
        )
      `,
      type: `string`
    },
    employeePhone: {
      sql: `employee_phone`,
      type: `string`,
      title: "Внутренний АТС номер"
    },
    callId: {
      sql: `call_id`,
      type: `string`
    },
    duration: {
      sql: `duration`,
      type: `string`,
      title: "Длительность"
    },
    link: {
      sql: `link`,
      type: `string`
    },
    startDate: {
      sql: `start_date`,
      type: `time`,
      title: "Дата начала"
    },
    status: {
      sql: `status`,
      type: `string`,
      title: "Статус"
    },
    outcomeCounterpartyId: {
      sql: `outcome_counterparty_id`,
      type: `number`
    },
    incomeCounterpartyId: {
      sql: `income_counterparty_id`,
      type: `number`
    }
  },

  preAggregations: {
    main: {
      type: `originalSql`,
    },
  }

});