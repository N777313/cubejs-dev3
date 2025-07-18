cube(`EmployeeActivities`, {
  sql: `
    WITH all_activities_with_type AS (
      SELECT
          est_act.report_date,
          est_act.employee_id,
          est_act.project_id,
          'estimate' AS activity_type,
          est_act.document_id AS source_id
      FROM ${EstimateActivity.sql()} AS est_act

      UNION ALL

      SELECT
          act_act.report_date,
          act_act.employee_id,
          act_act.project_id,
          'act' AS activity_type,
          act_act.document_id AS source_id
      FROM ${ActActivity.sql()} AS act_act

      UNION ALL

      SELECT
          inv_act.report_date,
          inv_act.employee_id,
          inv_act.project_id,
          'invoice' AS activity_type,
          inv_act.document_id AS source_id
      FROM ${InvoiceActivity.sql()} AS inv_act

      UNION ALL

      SELECT
          con_act.report_date,
          con_act.employee_id,
          con_act.project_id,
          'contract' AS activity_type,
          con_act.document_id AS source_id
      FROM ${ContractCreatedActivity.sql()} AS con_act

      UNION ALL

      SELECT
          proj_resp.report_date,
          proj_resp.employee_id,
          proj_resp.project_id,
          CASE proj_resp.responsible_user_type
              WHEN 'responsible_user' THEN 'project_resp_work'
              WHEN 'material_responsible_user' THEN 'project_resp_material'
              WHEN 'director_responsible_user' THEN 'project_resp_director'
              ELSE 'project_resp_unknown'
          END AS activity_type,
          CONCAT('resp_', proj_resp.responsible_user_type, '_', proj_resp.project_id, '_', proj_resp.employee_id, '_', proj_resp.report_date) AS source_id
      FROM ${ProjectResponsibilityActivity.sql()} AS proj_resp
    )
    SELECT
        CONCAT(
            IFNULL(CAST(act.employee_id AS CHAR), 'empNA'), '_',
            IFNULL(CAST(act.project_id AS CHAR), 'projNA'), '_',
            IFNULL(CAST(act.report_date AS CHAR), 'dateNA'), '_',
            IFNULL(act.activity_type, 'typeNA'), '_',
            IFNULL(CAST(act.source_id AS CHAR), 'srcNA')
         ) as row_id,
        act.report_date,
        act.employee_id,
        act.project_id,
        act.activity_type
    FROM
        all_activities_with_type act
    WHERE act.employee_id IS NOT NULL AND act.project_id IS NOT NULL
  `,
  joins: {
    Employees: {
      relationship: `belongsTo`,
      sql: `${CUBE}.employee_id = ${Employees.id}`
    },
    Position: {
      relationship: `belongsTo`,
      sql: `${Employees.positionId} = ${Position.id}`
    },
    MultiProjects: {
        relationship: 'belongsTo',
        sql: `${CUBE}.project_id = ${MultiProjects.id}`
    }
  },

  measures: {
    totalActivity: {
      type: `count`,
      title: 'Общая активность (кол-во событий)'
    },
    estimatesCreated: {
      type: `count`,
      title: 'Смет создано',
      filters: [
        { sql: `${CUBE}.activity_type = 'estimate'` }
      ]
    },
    actsConfirmedPaid: {
      type: `count`,
      title: 'Актов подтвержденных и оплаченных',
      filters: [
        { sql: `${CUBE}.activity_type = 'act'` }
      ]
    },
    invoicesCreated: {
      type: `count`,
      title: 'Накладных создано',
      filters: [
        { sql: `${CUBE}.activity_type = 'invoice'` }
      ]
    },
    contractsCreated: {
      type: `count`,
      title: 'Договоров создано',
      filters: [
        { sql: `${CUBE}.activity_type = 'contract'` }
      ]
    },
    projectsResponsibleWork: {
      type: `count`,
      title: 'Назначений отв. за работы',
      filters: [
        { sql: `${CUBE}.activity_type = 'project_resp_work'` }
      ]
    },
    projectsResponsibleMaterial: {
      type: `count`,
      title: 'Назначений отв. за материалы',
      filters: [
        { sql: `${CUBE}.activity_type = 'project_resp_material'` }
      ]
    },
    projectsResponsibleDirector: {
      type: `count`,
      title: 'Назначений директором',
      filters: [
        { sql: `${CUBE}.activity_type = 'project_resp_director'` }
      ]
    }
  },

  dimensions: {
    rowId: {
        sql: `row_id`,
        type: `string`,
        primaryKey: true,
        shown: false
    },
    employee_id: {
      sql: `employee_id`,
      shown: true,
      type: `number`,
      title: 'ID сотрудника'
    },
    project_id: {
        sql: `project_id`,
        type: `number`,
        title: 'ID Проекта'
    },
    report_date: {
      sql: `report_date`,
      type: `time`,
      title: 'Дата'
    },
    activityType: {
      sql: `activity_type`,
      type: `string`,
      title: 'Тип активности'
    }
  }
}); 