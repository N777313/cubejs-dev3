cube(`WorksContract`, {
  extends: Contract,

  sql: `
    SELECT 
      c.*, 
      wc.attached_estimate_id, 
      wc.external_work_coefficient,
      wc.execution_days
    FROM works_contract wc
    LEFT JOIN ${Contract.sql()} c ON c.id = wc.id
  `,
  title: "Договор на работы",
  
  joins: {
    Estimate: {
      sql: `${CUBE.attachedEstimateId} = ${Estimate.id}`,
      relationship: `hasOne`
    },
    PeriodExtensionContractAgreement: {
      sql: `${CUBE.id} = ${PeriodExtensionContractAgreement.contractId}`,
      relationship: `hasMany`
    },
    IdleActContractAgreement: {
      sql: `${CUBE.id} = ${IdleActContractAgreement.contractId}`,
      relationship: `hasMany`
    },
    HandoverContractAgreement: {
      sql: `${CUBE.id} = ${HandoverContractAgreement.contractId}`,
      relationship: `hasOne`
    },
    DiscountContractAgreement: {
      sql: `${CUBE.id} = ${DiscountContractAgreement.contractId}`,
      relationship: `hasOne`
    },
    TerminationContractAgreement: {
      sql: `${CUBE.id} = ${TerminationContractAgreement.contractId}`,
      relationship: `hasOne`
    },
    ProjectReturnContractAgreement: {
      sql: `${CUBE.id} = ${ProjectReturnContractAgreement.contractId}`,
      relationship: `hasOne`
    },
    MultiProjects: {
      sql: `${CUBE.projectId} = ${MultiProjects.id}`,
      relationship: `belongsTo`
    },
    Act: {
      sql: `${CUBE.id} = ${Act.contractId}`,
      relationship: `hasMany`
    },
    AggAct: {
      sql: `${CUBE.id} = ${AggAct.contractId}`,
      relationship: `hasMany`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: "Кол-во",
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: "Номер",
      shown: true,
    },
    
    externalWorkCoefficient: {
      sql: `external_work_coefficient`,
      type: `string`,
      title: "КФ на доп. работы",
    },

    discount: {
      sql: `${DiscountContractAgreement.discountSum}`,
      type: `number`,
      title: "Сумма скидки",
    },

    discountPercent: {
      sql: `${CUBE.discount} / ${Estimate.sum}`,
      type: `number`
    },

    startDate: {
      sql: `IFNULL(${HandoverContractAgreement.documentDate}, ${CUBE.documentDate})`,
      type: `time`,
      title: "Дата начала",
    },

    daysAfterProjectCreated: {
      sql: ` TIMESTAMPDIFF(DAY, ${MultiProjects.dateCreated}, ${CUBE.documentDate})`,
      type: `number`
    },

    daysAfterProjectCreatedGroup: {
      sql: `
        CASE 
          WHEN ${CUBE.daysAfterProjectCreated} < 7 THEN CONCAT(${CUBE.daysAfterProjectCreated}, " дней")
          WHEN ${CUBE.daysAfterProjectCreated} > 7 THEN CONCAT(ROUND(${CUBE.daysAfterProjectCreated} / 7), " недель")
        END
      `,
      type: `string`
    },

    initialExecutionDays: {
      sql: `execution_days`,
      type: `number`,
      title: "Начальный срок выполнения",
    },

    extensionDays: {
      sql: `IFNULL(${PeriodExtensionContractAgreement.extensionDaysSum}, 0)`,
      subQuery: true,
      type: `number`,
      title: "Кол-во дней продления",
    },

    executionDays: {
      sql: `${CUBE.initialExecutionDays} + ${CUBE.extensionDays}`,
      type: `number`,
      title: "Кол-во дней с продлением",
    },

    daysToEnd: {
      sql: `TIMESTAMPDIFF(DAY, NOW(),${CUBE.endDate})`,
      type: `number`
    },

    endDate: {
      sql: `DATE_ADD(${CUBE.startDate}, INTERVAL ${CUBE.executionDays} DAY)`,
      type: `time`,
      title: "Дата окончания",
    },

    isClosed: {
      sql: `COALESCE(${TerminationContractAgreement.id}, ${ProjectReturnContractAgreement.documentDate}) IS NOT NULL`,
      type: `boolean`
    },

    actualEndDate: {
      sql: `
        COALESCE(
          ${TerminationContractAgreement.documentDate},
          ${ProjectReturnContractAgreement.documentDate},
          DATE_ADD(${CUBE.startDate}, INTERVAL ${CUBE.executionDays} DAY)
        )       
       `,
      type: `time`,
      title: "Дата окончания с продлением",
    },

    attachedEstimateId: {
      sql: `attached_estimate_id`,
      type: `number`
    },

    hasConfirmedAct: {
      sql: `
        ${Act.confirmedCount} > 0
      `,
      subQuery: true,
      type: `boolean`
    }
  },
  
  dataSource: `default`
});
