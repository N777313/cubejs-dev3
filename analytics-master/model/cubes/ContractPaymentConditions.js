cube(`ContractPaymentConditions`, {
  sql: `
    SELECT 
      p.id AS project_id,
      p.name AS project_name,
      p.project_status_id AS status_id,
      s.name AS pipeline_stage_name,
      sg.id AS funnel_id,
      sg.name AS funnel_name,
      wc.id AS contract_id,
      wc.external_work_coefficient AS additional_coefficient,
      e.id AS estimate_id,
      e.sum AS estimate_sum,
      e.factor AS estimate_factor,
      COALESCE(
        (SELECT SUM(rv.floor_square) 
         FROM room r 
         JOIN room_version rv ON rv.room_id = r.id 
         WHERE r.project_id = p.id),
         0
      ) AS total_square,
      (SELECT SUM(a.sum) 
       FROM act a 
       JOIN document d ON a.id = d.id 
       WHERE a.contract_id = wc.id AND d.is_paid = 1 AND d.is_deleted = 0) AS paid_acts_sum
    FROM 
      project p
    JOIN 
      project_status ps ON p.project_status_id = ps.id
    JOIN 
      status s ON ps.id = s.id
    JOIN
      status_group sg ON s.status_group_id = sg.id
    JOIN 
      document d ON p.id = d.project_id
    JOIN 
      works_contract wc ON d.id = wc.id
    JOIN 
      estimate e ON wc.attached_estimate_id = e.id
    WHERE 
      d.is_deleted = 0
      AND d.type = 'works_contract'
  `,
  
  joins: {
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE.projectId} = ${MultiProjects.id}`
    },
    ProjectStatus: {
      relationship: `belongsTo`,
      sql: `${CUBE.statusId} = ${ProjectStatus.id}`
    },
    WorksContract: {
      relationship: `belongsTo`,
      sql: `${CUBE.contractId} = ${WorksContract.id}`
    },
    Estimate: {
      relationship: `belongsTo`,
      sql: `${CUBE.estimateId} = ${Estimate.id}`
    },
    AggAct: {
      relationship: `hasMany`,
      sql: `${CUBE.contractId} = ${AggAct.contractId}`
    },
    DiscountContractAgreement: {
      relationship: `hasOne`,
      sql: `${CUBE.contractId} = ${DiscountContractAgreement.contractId}`
    }
  },
  
  measures: {
    count: {
      type: `count`
    },
    
    totalEstimateSum: {
      sql: `estimate_sum`,
      type: `sum`,
      title: `Сумма сметы`
    },
    
    avgEstimatePerSquare: {
      sql: `CASE WHEN ${CUBE.totalSquare} > 0 THEN ${CUBE.estimateSum} / ${CUBE.totalSquare} ELSE 0 END`,
      type: `avg`,
      title: `Средняя сумма за м² сметы`
    },
    
    totalPaidActsSum: {
      sql: `paid_acts_sum`,
      type: `sum`,
      title: `Сумма оплаченных актов`
    },
    
    avgActsPerSquare: {
      sql: `CASE WHEN ${CUBE.totalSquare} > 0 THEN ${CUBE.paidActsSum} / ${CUBE.totalSquare} ELSE 0 END`,
      type: `avg`,
      title: `Средняя сумма за м² по актам`
    },
    
    avgPercentageDifference: {
      sql: `
        CASE 
          WHEN ${CUBE.estimateSum} > 0 THEN 
            ((${CUBE.paidActsSum} - ${CUBE.estimateSum}) / ${CUBE.estimateSum}) * 100 
          ELSE 0 
        END
      `,
      type: `avg`,
      title: `Средний % разницы между актами и сметой`
    },
    
    totalDiscountSum: {
      sql: `(
        SELECT SUM(dca.discount_sum)
        FROM discount_contract_agreement dca
        JOIN contract_agreement ca ON dca.id = ca.id
        WHERE ca.contract_id = ${CUBE.contractId}
        AND dca.is_canceled = 0
      )`,
      type: `sum`,
      title: `Сумма скидок`
    }
  },
  
  dimensions: {
    projectId: {
      sql: `project_id`,
      type: `number`,
      title: `ID проекта`,
      primaryKey: true
    },
    
    projectName: {
      sql: `project_name`,
      type: `string`,
      title: `Название проекта`
    },
    
    statusId: {
      sql: `status_id`,
      type: `number`,
      title: `ID статуса`
    },
    
    funnelId: {
      sql: `funnel_id`,
      type: `number`,
      title: `ID Воронки`
    },
    
    funnelName: {
      sql: `funnel_name`,
      type: `string`,
      title: `Воронка`
    },
    
    pipelineStage: {
      sql: `pipeline_stage_name`,
      type: `string`,
      title: `Статус проекта (Этап)`
    },
    
    contractId: {
      sql: `contract_id`,
      type: `number`,
      title: `ID договора`
    },
    
    estimateSum: {
      sql: `estimate_sum`,
      type: `number`,
      title: `Сумма сметы`
    },
    
    estimateSumPerSquare: {
      sql: `CASE WHEN ${CUBE.totalSquare} > 0 THEN ${CUBE.estimateSum} / ${CUBE.totalSquare} ELSE 0 END`,
      type: `number`,
      title: `Сумма за м² сметы`
    },
    
    paidActsSum: {
      sql: `paid_acts_sum`,
      type: `number`,
      title: `Сумма оплаченных актов`
    },
    
    actsSumPerSquare: {
      sql: `CASE WHEN ${CUBE.totalSquare} > 0 THEN ${CUBE.paidActsSum} / ${CUBE.totalSquare} ELSE 0 END`,
      type: `number`,
      title: `Сумма за м² по актам`
    },
    
    percentageDifference: {
      sql: `
        CASE 
          WHEN ${CUBE.estimateSum} > 0 THEN 
            ((${CUBE.paidActsSum} - ${CUBE.estimateSum}) / ${CUBE.estimateSum}) * 100 
          ELSE 0 
        END
      `,
      type: `number`,
      title: `% разницы между актами и сметой`
    },
    
    estimateCoefficient: {
      sql: `estimate_factor`,
      type: `number`,
      title: `КФ сметы`
    },
    
    additionalCoefficient: {
      sql: `additional_coefficient`,
      type: `number`,
      title: `Дп КФ`
    },
    
    discountType: {
      sql: `(
        SELECT 
          CASE dca.discount_type
            WHEN 'single_payment' THEN 'Разовая выплата скидки (от суммы сметы)'
            WHEN 'act_payment' THEN 'Скидка за каждый акт'
            ELSE dca.discount_type -- Оставляем как есть, если появится новый тип
          END
        FROM discount_contract_agreement dca
        JOIN contract_agreement ca ON dca.id = ca.id
        WHERE ca.contract_id = ${CUBE.contractId}
        AND dca.is_canceled = 0
        LIMIT 1
      )`,
      type: `string`,
      title: `Тип скидки`
    },
    
    discountPercent: {
      sql: `(
        SELECT dca.discount_percent
        FROM discount_contract_agreement dca
        JOIN contract_agreement ca ON dca.id = ca.id
        WHERE ca.contract_id = ${CUBE.contractId}
        AND dca.is_canceled = 0
        LIMIT 1
      )`,
      type: `number`,
      title: `Условия скидки %`
    },
    
    discountSum: {
      sql: `(
        SELECT 
          CASE
            WHEN dca.discount_percent IS NOT NULL AND dca.discount_percent > 0 
            THEN (${CUBE.estimateSum} * dca.discount_percent / 100) -- Расчет суммы по проценту от сметы
            ELSE dca.discount_sum -- Иначе берем сумму из базы (для скидок с фиксированной суммой)
          END
        FROM discount_contract_agreement dca
        JOIN contract_agreement ca ON dca.id = ca.id
        WHERE ca.contract_id = ${CUBE.contractId}
        AND dca.is_canceled = 0
        LIMIT 1
      )`,
      type: `number`,
      title: `Сумма скидки`
    },
    
    totalSquare: {
      sql: `total_square`,
      type: `number`,
      title: `Общая площадь`
    }
  }
}) 