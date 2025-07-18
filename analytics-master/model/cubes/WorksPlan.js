cube(`WorksPlan`, {
  sql: `
   WITH RECURSIVE works_contract_cte AS (
        SELECT 
          wc.id,
          COALESCE(
             tca.document_date, 
             prca.document_date,
             DATE_ADD(wc.document_date, INTERVAL (wc.execution_days + IFNULL(peca.extension_days, 0)) DAY)
          ) end_date,
          IFNULL(hca.document_date, wc.document_date) start_date,
          wc.attached_estimate_id,
          prca.id IS NOT NULL is_project_return
        FROM ${WorksContract.sql()} wc
        LEFT JOIN ${HandoverContractAgreement.sql()} hca ON hca.contract_id = wc.id 
        LEFT JOIN (
            SELECT peca.contract_id, sum(peca.extension_days) extension_days 
            FROM ${PeriodExtensionContractAgreement.sql()} peca
            GROUP BY peca.contract_id
        ) peca ON wc.id = peca.contract_id
        LEFT JOIN ${TerminationContractAgreement.sql()} tca ON tca.contract_id = wc.id
        LEFT JOIN ${ProjectReturnContractAgreement.sql()} prca ON prca.contract_id = wc.id
   ),
   cte AS (
     SELECT
       e.id estimate_id,
       e.project_id project_id,
       wc.id contract_id,
       ROUND(e.sum / NULLIF(CEILING(DATEDIFF(end_date, start_date) / 7), 0)) sum,
       start_date,
       end_date,              
       1 start,
       CEILING(DATEDIFF(end_date, start_date) / 7) diff,
       start_date cur_date,
       wc.is_project_return is_project_return
     FROM ${Estimate.sql()} e
     LEFT JOIN works_contract_cte wc ON wc.attached_estimate_id = e.id
     WHERE wc.id IS NOT NULL
    UNION all
    SELECT estimate_id, project_id, contract_id, sum, start_date, end_date, start + 1 start, diff, DATE_ADD(start_date, INTERVAL start WEEK) cur_date, is_project_return
    FROM cte
    WHERE start < diff
  )
  
  select cte.contract_id, cte.project_id, cte.sum estimate_sum, cte.cur_date date, cte.is_project_return is_project_return
  from cte
`,
  joins: {
    WorksContract: {
      sql: `${CUBE.contractId} = ${WorksContract.id}`,
      relationship: `hasOne`
    },
    MultiProjects: {
      sql: `${CUBE.projectId} = ${MultiProjects.id}`,
      relationship: `belongsTo`
    }
  },
  measures: {
    count: {
      type: `count`,
      drillMembers: [contractId],
      title: 'Количество'
    },
    estimatePeriodSum: {
      type: `sum`,
      sql: `estimate_sum`
    },
  },
  dimensions: {
    contractId: {
      sql: `contract_id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },
    projectId: {
      sql: `project_id`,
      type: `number`
    },
    estimateSum: {
      sql: `estimate_sum`,
      type: `number`
    },
    date: {
      sql: `date`,
      type: `time`
    },
    isProjectReturn: {
      sql: `is_project_return`,
      type: `boolean`
    }
  },

  preAggregations: {
    main: {
      type: `originalSql`
    }
  }
})


