cube(`Works`, {
  sql: `
    SELECT w.*,
    a.contract_id,
    IFNULL((
      SELECT coefficient 
      FROM ${PieceWorkSalary.sql()} s
      WHERE s.employee_id = w.employee_id AND s.salary_date <= d.document_date
      ORDER BY s.salary_date DESC
      LIMIT 1
    ), 
      (
      SELECT coefficient 
      FROM ${PieceWorkSalary.sql()} s
      WHERE s.employee_id = w.employee_id AND s.salary_date >= d.document_date
      ORDER BY s.salary_date
      LIMIT 1
      )
    ) employee_coefficient
    FROM work w
    LEFT JOIN document d ON d.id = w.document_id
    LEFT JOIN act a ON a.id = w.document_id
    `,

  title: 'Работы',

  joins: {
    WorkTypes: {
      sql: `${CUBE.workTypeId} = ${WorkTypes.id}`,
      relationship: `belongsTo`
    },
    Categories: {
      sql: `${CUBE.categoryId} = ${Categories.id}`,
      relationship: `belongsTo`
    },
    RoomsVersion: {
      sql: `${CUBE.roomId} = ${RoomsVersion.id}`,
      relationship: `belongsTo`
    },
    Employees: {
      sql: `${CUBE.employeeId} = ${Employees.id}`,
      relationship: `belongsTo`
    },
    Act: {
      sql: `${CUBE.documentId} = ${Act.id}`,
      relationship: `belongsTo`
    },
    Documents: {
      sql: `${CUBE.documentId} = ${Documents.id}`,
      relationship: `belongsTo`
    },
    Estimate: {
      sql: `${CUBE.documentId} = ${Estimate.id}`,
      relationship: `belongsTo`
    },
    MultiProjects: {
      sql: `${CUBE.projectId} = ${MultiProjects.id}`,
      relationship: `belongsTo`
    },
    WorkContractPrice: {
      sql: `${CUBE}.contract_id = ${WorkContractPrice}.contract_id AND ${CUBE}.work_type_id = ${WorkContractPrice}.work_type_id`,
      relationship: `belongsTo`,
    },
    WorksContractEstimate: {
      sql: `${CUBE}.contract_id = ${WorksContractEstimate}.contract_id`,
      relationship: `belongsTo`
    },
    WorksContract: {
      sql: `${CUBE}.contract_id = ${WorksContract}.id`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    },
    clientSumExternalDiffSum: {
      type: `sum`,
      sql: `${CUBE.clientSumExternalDiff}`
    },
    clientSumMeasure: {
      type: `sum`,
      sql: `${CUBE.clientSum}`
    },
    clientSumRatio: {
      sql: `${CUBE.clientSumMeasure} / SUM(${CUBE.clientSumMeasure}) over ()`,
      type: `number`
    },
    employeeSumMeasure: {
      type: `sum`,
      sql: `${CUBE.employeeSum}`
    },
    originalEmployeeSumMeasure: {
      type: `sum`,
      sql: `${CUBE.originalEmployeeSum}`
    },
    projectCount: {
      type: `countDistinct`,
      sql: `project_id`
    },
    profitSum: {
      type: `sum`,
      sql: `${CUBE.profit}`
    },
    profitSumRatio: {
      sql: `${CUBE.profitSum} / SUM(${CUBE.profitSum}) over ()`,
      type: `number`
    },
    clientSumAvgByProject: {
      type: `number`,
      sql: `${CUBE.clientSumMeasure} / ${CUBE.projectCount}`
    },
    employeeSumAvgByProject: {
      type: `number`,
      sql: `${CUBE.employeeSumMeasure} / ${CUBE.projectCount}`
    },
    profitSumAvgByProject: {
      type: `number`,
      sql: `${CUBE.profitSum} / ${CUBE.projectCount}`
    },
    avgProfitabilityByProject: {
      type: `number`,
      sql: `${CUBE.profitSum} / ${CUBE.clientSumMeasure}`
    },
    avgCoefficient: {
      type: `avg`,
      sql: `${WorksContractEstimate.factor}`
    },
    avgClientPriceValue: {
      type: `avg`,
      sql: `${CUBE.clientPriceValue}`
    },
    avgSalaryPriceValue: {
      type: `avg`,
      sql: `${CUBE.salaryPriceValue}`
    },
    avgProfitability: {
      type: `avg`,
      sql: `${CUBE.profitability}`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    dateCreated: {
      sql: `date_created`,
      type: `time`
    },

    isSalaryManual: {
      sql: `is_salary_manual`,
      type: `number`
    },

    isPriceManual: {
      sql: `is_price_manual`,
      type: `number`
    },

    volume: {
      sql: `volume`,
      type: `string`,
      title: 'Объём'
    },

    clientFactor: {
      sql: `IFNULL(${Estimate.factor}, ${WorksContractEstimate.factor})`,
      type: `number`,
      title: 'КФ клиента'
    },

    employeeCoefficient: {
      sql: `employee_coefficient`,
      type: `number`,
      title: 'КФ работника'
    },

    priceValue: {
      sql: `price_value`,
      type: `string`
    },

    contractPrice: {
      sql: `${WorkContractPrice.price}`,
      type: `number`,
      title: 'Цена по прайсу'
    },

    isExternal: {
      sql: `${WorkContractPrice.isExternal}`,
      type: `boolean`
    },

    clientPriceExternalDiff: {
      sql: `IF(${CUBE.isExternal} AND ${Categories.shouldUseExternalFactor}, ${CUBE.contractPrice} - (${CUBE.contractPrice} / ${WorksContract.externalWorkCoefficient}), 0)`,
      type: `number`
    },

    clientSumExternalDiff: {
      sql: `${CUBE.clientPriceExternalDiff} * ${CUBE.volume}`,
      type: `number`
    },

    clientPriceValue: {
      type: `number`,
      sql: `IF(${CUBE.isPriceManual}, ${CUBE.priceValue}, IFNULL(${CUBE.contractPrice}, ${CUBE.priceValue}) * ${CUBE.clientFactor})`,
      title: 'Цена'
    },

    salary: {
      sql: `salary`,
      type: `string`
    },

    salaryPriceValue: {
      sql: `IF(${CUBE.isSalaryManual} OR ${CUBE.employeeId} IS NULL, ${CUBE.salary}, ${CUBE.salary} * ${CUBE.employeeCoefficient})`,
      type: `number`,
      title: 'ЗП'
    },

    name: {
      sql: `name`,
      type: `string`,
      title: 'Название'
    },

    unit: {
      sql: `unit`,
      type: `string`,
      title: 'Ед.изм'
    },

    workTypeId: {
      sql: `work_type_id`,
      type: `number`,
    },
    categoryId: {
      sql: `category_id`,
      type: `number`
    },

    employeeId:  {
      sql: `employee_id`,
      type: `number`
    },

    projectId: {
      sql: `${CUBE}.project_id`,
      type: `number`
    },

    roomId: {
      sql: `room_id`,
      type: `number`
    },

    documentId: {
      sql: `document_id`,
      type: `number`
    },

    clientSum: {
      type: `number`,
      sql: `${CUBE.clientPriceValue} * ${CUBE.volume}`,
      title: 'Сумма клиенту'
    },

    employeeSum: {
      type: `number`,
      sql: `${CUBE.salaryPriceValue} * ${CUBE.volume}`,
      title: 'Сумма ЗП'
    },

    originalEmployeeSum: {
      type: `number`,
      sql: `${CUBE.salary} * ${CUBE.volume}`
    },

    profitability: {
      type: `number`,
      sql: `IF(${CUBE.clientSum} > 0, 100 * ROUND((${CUBE.profit}) / (  ${CUBE.clientSum}), 2), 0)`,
      format: `percent`,
      title: 'Рентабельность'
    },

    profit: {
      type: `number`,
      sql: `${CUBE.clientSum} - ${CUBE.employeeSum}`,
      title: 'Прибыль'
    },

    rating: {
      type: `number`,
      sql: `${CUBE}.rating`
    },

    roomName: {
      type: `string`,
      sql: `IFNULL(${Rooms.name}, 'Без комнаты')`,
      title: 'Комната'
    }
  }
});
