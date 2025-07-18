cube(`Salary`, {
  extends: SalaryVersion,

  sql: `
    SELECT 
        sv.*,
        s.id salary_id,
        s.type,
        s.salary_version_id 
    FROM salary s
    LEFT JOIN ${SalaryVersion.sql()} sv ON sv.id = s.salary_version_id 
    `,
  
  joins: {
    User: {
      sql: `${User.id} = ${CUBE}.author_user_id`,
      relationship: `belongsTo`
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },

  },
  
  dimensions: {
    id: {
      sql: `salary_id`,
      type: `number`,
      primaryKey: true
    },
    type: {
      sql: `type`,
      type: `string`
    },

    salaryVersionId: {
      sql: `salary_version_id`,
      type: `number`
    }
  }
});