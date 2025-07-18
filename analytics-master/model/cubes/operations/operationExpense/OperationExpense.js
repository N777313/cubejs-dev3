cube(`OperationExpense`, {
  sql: `SELECT * FROM operation_expense`,
  title: "Статья учета",
  joins: {
    OperationExpensePath: {
      relationship: 'hasOne',
      sql: `${OperationExpense}.id = ${OperationExpensePath}.id`
    },
    ManagementOperation: {
      relationship: `hasMany`,
      sql: `${OperationExpense}.id = ${ManagementOperation}.operation_expense_id`
    },
    ExpenseTypeForm: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${ExpenseTypeForm.operationExpenseId}`
    },
    Department: {
      relationship: `hasOne`,
      sql: `${CUBE}.department_id = ${Department}.id`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name],
      title: "Кол-во",
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: "№",
      shown: true
    },

    name: {
      sql: `name`,
      type: `string`,
      title: "Название",
    },

    parentId: {
      sql: `parent_id`,
      type: `number`,
      title: "Номер родителя",
    },

    type: {
      sql: `fin_type`,
      type: `string`,
      title: "Тип в ОПИУ",
    },
    isActive: {
      sql: `is_active`,
      type: `boolean`,
      title: `Активна`
    },
    typeLabel: {
      type: `string`,
      title: "Описание типа в ОПИУ",
      case: {
        when: [
          {
            sql: `${CUBE.type} = 'factory'`,
            label: 'Производственный'
          },
          {
            sql: `${CUBE.type} = 'admin'`,
            label: 'Административный'
          },
          {
            sql: `${CUBE.type} = 'com'`,
            label: 'Коммерческий'
          },
          {
            sql: `${CUBE.type} = 'dividends'`,
            label: 'Дивиденды'
          },
          {
            sql: `${CUBE.type} = 'taxes'`,
            label: 'Налоги'
          },
          {
            sql: `${CUBE.type} = 'royalty'`,
            label: 'Роялти'
          },
        ],
        else : {
          label: 'Другое'
        }
      }

    }
  }
});
