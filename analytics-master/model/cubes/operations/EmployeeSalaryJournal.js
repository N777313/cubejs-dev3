cube(`EmployeeSalaryJournal`, {
  title: 'Дневник начислений',
  
  sql: `
    SELECT 
        o.id,
        o.period_date,
        d.id as document_id,
        CASE 
            -- Все выплаты (EXPENDITURE) называются "Транзакция"
            WHEN o.sign_type = 'EXPENDITURE' THEN 'Транзакция'
            
            WHEN (d.name IS NULL OR d.name = '') AND eo.employee_operation_type = 'fixed_payroll' THEN 'Начисление оклада'
            WHEN (d.name IS NULL OR d.name = '') AND eo.employee_operation_type = 'piece_work_payroll' THEN 'Начисление сдельной оплаты'
            WHEN (d.name IS NULL OR d.name = '') AND eo.employee_operation_type = 'bonus' THEN 'Начисление премии'
            WHEN (d.name IS NULL OR d.name = '') THEN CONCAT('Операция: ', eo.employee_operation_type)
            ELSE d.name
        END as document_name,
        np.id as employee_id,
        CONCAT(np.name, ' ', np.second_name, ' ', COALESCE(np.patronymic, '')) as employee_full_name,
        p.id as position_id,
        p.name as position_name,
        CASE 
            -- Начисления (INCOME)
            WHEN o.sign_type = 'INCOME' AND eo.employee_operation_type = 'piece_work_payroll' AND NOT eo.is_deduction THEN 'Начисление зарплаты'
            WHEN o.sign_type = 'INCOME' AND eo.employee_operation_type = 'piece_work_payroll' AND eo.is_deduction THEN 'Начисление удержания'
            WHEN o.sign_type = 'INCOME' AND eo.employee_operation_type = 'bonus' THEN 'Начисление премии'
            WHEN o.sign_type = 'INCOME' AND eo.employee_operation_type = 'fixed_payroll' THEN 'Начисление оклада'
            
            -- Выплаты (EXPENDITURE)
            WHEN o.sign_type = 'EXPENDITURE' AND NOT eo.is_deduction THEN 'Выплата заработной платы'
            WHEN o.sign_type = 'EXPENDITURE' AND eo.is_deduction THEN 'Выплата удержаний'
            
            -- Другие типы операций
            ELSE CONCAT(IF(o.sign_type = 'INCOME', 'Начисление ', 'Выплата '), eo.employee_operation_type)
        END as payment_type,
        CASE
            WHEN o.sign_type = 'INCOME' THEN o.sum
            ELSE 0
        END as accrued,
        CASE
            WHEN o.sign_type = 'EXPENDITURE' THEN o.sum
            ELSE 0
        END as paid
    FROM 
        operation o
    JOIN 
        employee_operation eo ON o.id = eo.id
    JOIN 
        employees e ON eo.employee_id = e.id
    JOIN 
        natural_person np ON e.id = np.id
    JOIN 
        position p ON e.position_id = p.id
    LEFT JOIN 
        document d ON o.base_document = d.id
    WHERE 
        o.is_deleted = 0
        AND o.is_confirmed = 1
  `,
  
  joins: {
    Employees: {
      relationship: 'belongsTo',
      sql: `${CUBE}.employee_id = ${Employees}.id`
    },
    Documents: {
      relationship: 'belongsTo',
      sql: `${CUBE}.document_id = ${Documents}.id`
    },
    Position: {
      relationship: 'belongsTo',
      sql: `${CUBE}.position_id = ${Position}.id`
    },
    Operation: {
      relationship: 'belongsTo',
      sql: `${CUBE}.id = ${Operation}.id`
    }
  },
  
  measures: {
    count: {
      type: 'count',
      drillMembers: [id, documentId, employeeFullName, positionName, paymentType]
    },
    
    totalAccrued: {
      type: 'sum',
      sql: `accrued`,
      title: 'Всего начислено'
    },
    
    totalPaid: {
      type: 'sum',
      sql: `paid`,
      title: 'Всего выплачено'
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: 'number',
      primaryKey: true,
      title: 'ID'
    },
    
    date: {
      sql: `period_date`,
      type: 'time',
      title: 'Дата'
    },
    
    documentId: {
      sql: `document_id`,
      type: 'number',
      title: 'Номер документа'
    },
    
    documentName: {
      sql: `document_name`,
      type: 'string',
      title: 'Акт'
    },
    
    employeeId: {
      sql: `employee_id`,
      type: 'number'
    },
    
    employeeFullName: {
      sql: `employee_full_name`,
      type: 'string',
      title: 'ФИО'
    },
    
    positionId: {
      sql: `position_id`,
      type: 'number'
    },
    
    positionName: {
      sql: `position_name`,
      type: 'string',
      title: 'Должность'
    },
    
    paymentType: {
      sql: `payment_type`,
      type: 'string',
      title: 'Тип выплаты'
    },
    
    accrued: {
      sql: `accrued`,
      type: 'number',
      title: 'Начислено'
    },
    
    paid: {
      sql: `paid`,
      type: 'number',
      title: 'Выплачено'
    }
  }
}); 