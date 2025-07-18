cube(`FixedSalary`, {
  extends: Salary,

  sql: `
    SELECT 
        s.*, 
        sum  
    FROM fixed_salary fs
    LEFT JOIN ${Salary.sql()} s ON s.salary_id = fs.id
  `,


  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
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
    }
  },
  
  dataSource: `default`
});
