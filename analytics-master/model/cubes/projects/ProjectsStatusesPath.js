cube(`ProjectStatusesPath`, {
  sql: `
    SELECT 
        project_id, 
        GROUP_CONCAT(CONCAT(psg_name,"-",ps_name)) path 
    FROM ${ProjectStatusChangeEvent.sql()} psce
    GROUP BY project_id
  `,

  dimensions: {
    path: {
      sql: `path`,
      type: `string`
    },
    projectId: {
      sql: `project_id`,
      type: `number`
    }
  }
})