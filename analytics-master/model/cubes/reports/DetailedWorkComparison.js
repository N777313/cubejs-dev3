cube(`EstimateResponsibleEmployee`, {
  extends: UserEmployee,
  title: 'Ответственный (Смета)'
});

cube(`ActResponsibleEmployee`, {
  extends: UserEmployee,
  title: 'Ответственный (Акт)'
});

cube(`WorkExecutorEmployee`, {
  extends: Employees,
  title: 'Исполнитель (Работа)'
});

cube('WorkExecutorPosition', {
  extends: Position,
  title: 'Должность исполнителя (Куб)'
});

cube('ParentCategory', {
  extends: Categories,
  title: 'Родительская категория'
});

const buildWorkDetailsSelect = (options) => {
  const { type, wAlias, dAlias, specificDocAlias, wtAlias, catAlias, estimateAlias, actAlias, wcPriceAlias, actualRoomIdExpression } = options;

  const estimateResp = type === 'estimate' ? `${specificDocAlias}.responsible_employee_id` : 'NULL';
  const actResp = type === 'act' ? `${specificDocAlias}.responsible_employee_id` : 'NULL';
  const estimateDocId = type === 'estimate' ? `${dAlias}.id` : 'NULL';
  const actDocId = type === 'act' ? `${dAlias}.id` : 'NULL';
  const docDate = `${dAlias}.document_date`;
  const estimateVolume = type === 'estimate' ? `${wAlias}.volume` : '0';
  const calculatedEstimateUnitPrice = type === 'estimate' 
    ? `(CASE WHEN ${wAlias}.is_price_manual = 1 THEN ${wAlias}.price_value ELSE ${wAlias}.price_value * COALESCE(${estimateAlias}.factor, 1) END)`
    : '0';
  const actVolume = type === 'act' ? `${wAlias}.volume` : '0';
  const calculatedActUnitPrice = type === 'act'
    ? `(CASE WHEN ${wAlias}.is_price_manual = 1 THEN ${wAlias}.price_value ELSE IFNULL(${wcPriceAlias}.price, ${wAlias}.price_value) END)`
    : '0';

  return `
      ${wAlias}.project_id,
      ${actualRoomIdExpression} as actual_room_id,
      ${wAlias}.category_id,
      ${catAlias}.parent_category_id,
      ${wAlias}.work_type_id,
      COALESCE(${wAlias}.name, ${wtAlias}.name) as work_name,
      ${wAlias}.unit as unit,
      ${wAlias}.is_price_manual as is_price_manual, 
      ${estimateAlias !== 'NULL' ? `${estimateAlias}.factor` : 'NULL'} as estimate_factor_debug,
      ${wcPriceAlias !== 'NULL' ? `${wcPriceAlias}.price` : 'NULL'} as contract_price_debug,
      ${estimateResp} as estimate_responsible_id,
      ${actResp} as act_responsible_id,
      ${wAlias}.employee_id as executor_id,
      ${estimateDocId} as estimate_document_id,
      ${actDocId} as act_document_id,
      ${docDate} as doc_date,
      ${estimateVolume} as estimate_volume,
      ${calculatedEstimateUnitPrice} as estimate_unit_price,
      ${actVolume} as act_volume,
      ${calculatedActUnitPrice} as act_unit_price
  `;
};


cube(`DetailedWorkComparison`, {
  sql: `
    WITH WorkDetails AS (
      SELECT
          ${buildWorkDetailsSelect({
            type: 'estimate',
            wAlias: 'w',
            dAlias: 'd',
            specificDocAlias: 'e',
            wtAlias: 'wt',
            catAlias: 'c',
            estimateAlias: 'e',
            actAlias: 'NULL',
            wcPriceAlias: 'NULL',
            actualRoomIdExpression: 'r_actual_est.id'
          })}
      FROM work w
      JOIN document d ON w.document_id = d.id AND d.type = 'estimate' AND d.is_confirmed = 1 AND d.is_deleted = 0
      JOIN estimate e ON d.id = e.id
      LEFT JOIN work_type wt ON w.work_type_id = wt.id
      LEFT JOIN category c ON w.category_id = c.id
      LEFT JOIN room_version rv_est ON w.room_id = rv_est.id
      LEFT JOIN room r_actual_est ON rv_est.room_id = r_actual_est.id

      UNION ALL

      SELECT
          ${buildWorkDetailsSelect({
            type: 'act',
            wAlias: 'w',
            dAlias: 'd',
            specificDocAlias: 'a',
            wtAlias: 'wt',
            catAlias: 'c',
            estimateAlias: 'NULL',
            actAlias: 'a',
            wcPriceAlias: 'wcp',
            actualRoomIdExpression: 'r_actual_act.id'
          })}
      FROM work w
      JOIN document d ON w.document_id = d.id AND d.type = 'act' AND d.is_confirmed = 1 AND d.is_deleted = 0
      JOIN act a ON d.id = a.id
      LEFT JOIN work_contract_price wcp ON a.contract_id = wcp.contract_id AND w.work_type_id = wcp.work_type_id
      LEFT JOIN work_type wt ON w.work_type_id = wt.id
      LEFT JOIN category c ON w.category_id = c.id
      LEFT JOIN room_version rv_act ON w.room_id = rv_act.id
      LEFT JOIN room r_actual_act ON rv_act.room_id = r_actual_act.id
    )
    SELECT
        CONCAT_WS('-',
          project_id,
          COALESCE(actual_room_id, 0),
          COALESCE(category_id, 0),
          COALESCE(work_type_id, 0),
          work_name
        ) as primary_key_str,
        project_id,
        actual_room_id as room_id,
        category_id,
        MAX(parent_category_id) as parent_category_id,
        work_type_id,
        work_name,
        unit,
        MAX(estimate_responsible_id) as estimate_responsible_id,
        MAX(act_responsible_id) as act_responsible_id,
        MAX(executor_id) as executor_id,
        MAX(estimate_document_id) as estimate_document_id,
        GROUP_CONCAT(DISTINCT act_document_id ORDER BY doc_date SEPARATOR ', ') as act_document_ids,
        MAX(CASE WHEN estimate_document_id IS NOT NULL THEN doc_date ELSE NULL END) as estimate_date,
        MIN(CASE WHEN act_document_id IS NOT NULL THEN doc_date ELSE NULL END) as first_act_date,
        MIN(doc_date) as reference_date,
        SUM(estimate_volume) as estimate_volume,
        MAX(estimate_unit_price) as estimate_price,
        SUM(act_volume) as act_volume,
        MAX(act_unit_price) as act_price
    FROM WorkDetails
    GROUP BY
        project_id,
        actual_room_id,
        category_id,
        work_type_id,
        work_name,
        unit
    HAVING SUM(estimate_volume) > 0 OR SUM(act_volume) > 0
  `,

  title: `Детализированная сверка работ`,
  description: `Сравнивает каждую работу из подтвержденных смет и актов в одной строке, показывая объемы, суммы и отклонения.`,

  joins: {
    MultiProjects: {
      sql: `${CUBE}.project_id = ${MultiProjects.id}`,
      relationship: `belongsTo`
    },
    Rooms: {
      sql: `${CUBE}.room_id IS NOT NULL AND ${CUBE}.room_id = ${Rooms.id}`,
      relationship: `belongsTo`
    },
    Categories: {
      sql: `${CUBE}.category_id IS NOT NULL AND ${CUBE}.category_id = ${Categories.id}`,
      relationship: `belongsTo`
    },
    WorkTypes: {
      sql: `${CUBE}.work_type_id IS NOT NULL AND ${CUBE}.work_type_id = ${WorkTypes.id}`,
      relationship: `belongsTo`
    },
    EstimateResponsibleEmployee: {
      sql: `${CUBE}.estimate_responsible_id IS NOT NULL AND ${CUBE}.estimate_responsible_id = ${EstimateResponsibleEmployee.id}`,
      relationship: `hasOne`
    },
    ActResponsibleEmployee: {
      sql: `${CUBE}.act_responsible_id IS NOT NULL AND ${CUBE}.act_responsible_id = ${ActResponsibleEmployee.id}`,
      relationship: `hasOne`
    },
    WorkExecutorEmployee: {
      sql: `${CUBE}.executor_id IS NOT NULL AND ${CUBE}.executor_id = ${WorkExecutorEmployee.id}`,
      relationship: `hasOne`
    },
    ParentCategory: {
      sql: `${CUBE}.parent_category_id IS NOT NULL AND ${CUBE}.parent_category_id = ${ParentCategory.id}`,
      relationship: `belongsTo`
    },
    ProjectResponsible: {
      relationship: `belongsTo`,
      sql: `${MultiProjects.responsibleUserId} = ${ProjectResponsible.userId}`
    },
    WorkExecutorPosition: {
      relationship: 'belongsTo',
      sql: `${WorkExecutorEmployee.positionId} = ${WorkExecutorPosition.id}`
    }
  },

  measures: {
    count: {
      type: `count`,
      sql: `primary_key_str`,
      title: `Количество уникальных работ`
    },
    totalEstimateSum: {
      type: `sum`,
      sql: `${CUBE}.estimate_volume * ${CUBE}.estimate_price`,
      format: 'currency',
      title: `Общая сумма (Смета)`
    },
     totalActSum: {
      type: `sum`,
      sql: `${CUBE}.act_volume * ${CUBE}.act_price`,
      format: 'currency',
      title: `Общая сумма (Акты)`
    },

    totalVolumeDeviation: {
        type: `sum`,
        sql: `${CUBE}.act_volume - ${CUBE}.estimate_volume`,
        title: `Отклонение объема (Итог)`
    },
     totalSumDeviation: {
        type: `sum`,
        sql: `(${CUBE}.act_volume * ${CUBE}.act_price) - (${CUBE}.estimate_volume * ${CUBE}.estimate_price)`,
        format: 'currency',
        title: `Отклонение суммы (Итог)`
    },
    totalSumDeviationPercent: {
        type: `number`,
        sql: `CASE WHEN ${totalEstimateSum} = 0 THEN NULL ELSE ${totalSumDeviation} * 100.0 / ${totalEstimateSum} END`,
        format: "percent",
        title: `Отклонение суммы % (Итог)`
    }
  },

  dimensions: {
    primaryKey: {
      sql: `primary_key_str`,
      type: `string`,
      primaryKey: true,
      shown: false
    },

    projectName: {
      sql: `${MultiProjects.name}`,
      type: `string`,
      title: `Проект`
    },
    projectManagerName: {
      sql: `${ProjectResponsible.initials}`,
      type: `string`,
      title: `Менеджер проекта`
    },
    roomName: {
      sql: `COALESCE(${Rooms.name}, 'Без помещения')`,
      type: `string`,
      title: `Помещение`
    },
    categoryName: {
      sql: `COALESCE(${Categories.name}, 'Без категории')`,
      type: `string`,
      title: `Категория работ`
    },
    workTypeName: {
        sql: `COALESCE(${WorkTypes.name}, 'Без типа работ')`,
        type: `string`,
        title: `Тип работы`
    },
    workName: {
      sql: `work_name`,
      type: `string`,
      title: `Название работы`
    },
     unit: {
      sql: `unit`,
      type: `string`,
      title: `Ед. изм.`
    },

    estimateDocumentId: {
        sql: `estimate_document_id`,
        type: `number`,
        title: `ID Сметы`
    },
    estimateDate: {
        sql: `estimate_date`,
        type: `time`,
        title: `Дата сметы`
    },
    estimateVolume: {
        sql: `estimate_volume`,
        type: `number`,
        title: `Объем (Смета)`
    },
    estimatePrice: {
        sql: `estimate_price`,
        type: `number`,
        format: `currency`,
        title: `Цена (Смета)`
    },
     estimateSum: {
        sql: `${CUBE}.estimate_volume * ${CUBE}.estimate_price`,
        type: `number`,
        format: `currency`,
        title: `Сумма (Смета)`
    },

     actDocumentIds: {
        sql: `act_document_ids`,
        type: `string`,
        title: `ID Актов`
    },
    firstActDate: {
        sql: `first_act_date`,
        type: `time`,
        title: `Дата первого акта`
    },
    actVolume: {
        sql: `act_volume`,
        type: `number`,
        title: `Объем (Акты)`
    },
    actPrice: {
        sql: `act_price`,
        type: `number`,
        format: `currency`,
        title: `Цена (Акт)`
    },
     actSum: {
        sql: `${CUBE}.act_volume * ${CUBE}.act_price`,
        type: `number`,
        format: `currency`,
        title: `Сумма (Акты)`
    },

     volumeDeviation: {
        sql: `${CUBE}.act_volume - ${CUBE}.estimate_volume`,
        type: `number`,
        title: `Разница (Объем)`
    },
     sumDeviation: {
        sql: `${CUBE.actSum} - ${CUBE.estimateSum}`,
        type: `number`,
        format: `currency`,
        title: `Разница (Сумма)`
    },
    sumDeviationPercent: {
        type: `number`,
        sql: `CASE WHEN ${CUBE.estimateSum} = 0 THEN NULL ELSE (${CUBE.actSum} - ${CUBE.estimateSum}) * 100.0 / ${CUBE.estimateSum} END`,
        format: "percent",
        title: `% отклонения`
    },

     estimateResponsibleName: {
      sql: `COALESCE(${EstimateResponsibleEmployee.initials}, '-')`,
      type: `string`,
      title: `Ответственный (Смета)`
    },
    actResponsibleName: {
      sql: `COALESCE(${ActResponsibleEmployee.initials}, '-')`,
      type: `string`,
      title: `Ответственный (Акт)`
    },
     executorName: {
      sql: `COALESCE(${WorkExecutorEmployee.initials}, '-')`,
      type: `string`,
      title: `Исполнитель`
    },
    executorPositionName: {
      sql: `COALESCE(${WorkExecutorPosition.name}, '-')`,
      type: `string`,
      title: `Должность исполнителя`
    },

    referenceDate: {
        sql: `reference_date`,
        type: `time`,
        title: `Дата (Смета/1й Акт)`
    },
    parentCategoryName: {
        sql: `COALESCE(${ParentCategory.name}, 'Без родительской категории')`,
        type: `string`,
        title: `Родительская категория`
    },
  },

  segments: {
    onlyInEstimate: {
      sql: `${CUBE}.act_volume = 0 AND ${CUBE}.estimate_volume > 0`,
      title: 'Только в смете'
    },
    onlyInActs: {
      sql: `${CUBE}.estimate_volume = 0 AND ${CUBE}.act_volume > 0`,
      title: 'Только в актах (доп. работы)'
    },
    volumeMismatch: {
      sql: `${CUBE}.estimate_volume != ${CUBE}.act_volume`,
      title: 'Расхождение объемов'
    },
     priceMismatch: {
      sql: `ABS(${CUBE}.estimate_price - ${CUBE}.act_price) > 0.01`,
      title: 'Расхождение цен'
    },
     positiveDeviation: {
      sql: `${CUBE.sumDeviation} > 0`,
      title: 'Положительное отклонение (сумма)'
    },
     negativeDeviation: {
      sql: `${CUBE.sumDeviation} < 0`,
      title: 'Отрицательное отклонение (сумма)'
    }
  },

});