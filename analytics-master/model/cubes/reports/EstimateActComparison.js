const ALL_COLUMNS = [
  'work_id',
  'document_id',
  'document_type',
  'project_id',
  'actual_room_id',
  'category_id',
  'work_type_id',
  'work_name',
  'volume',
  'price_value',
  'is_price_manual',
  'estimate_factor',
  'contract_price',
  'works_contract_estimate_factor',
  'responsible_initials',
  'responsible_position_name',
  'executor_initials',
  'executor_position_name',
  'document_date'
];

const buildSelect = (options) => {
  return ALL_COLUMNS.map(colName => {
    const value = options[colName];
    if (value === undefined) {
      throw new Error(`Value for column ${colName} is missing in buildSelect options.`);
    }
    return `  ${value} as ${colName.replace(/^actual_/, '')}`;
  }).join(',\n');
};

cube(`EstimateActComparison`, {
  sql: `
    SELECT
      ${buildSelect({
        work_id: 'w.id',
        document_id: 'd.id',
        document_type: "'estimate'",
        project_id: 'd.project_id',
        actual_room_id: 'r_est.id',
        category_id: 'w.category_id',
        work_type_id: 'w.work_type_id',
        work_name: 'w.name',
        volume: 'w.volume',
        price_value: 'w.price_value',
        is_price_manual: 'w.is_price_manual',
        estimate_factor: 'e.factor',
        contract_price: 'NULL',
        works_contract_estimate_factor: 'NULL',
        responsible_initials: "COALESCE(CONCAT(resp_np.second_name, ' ', LEFT(resp_np.name, 1), '.', LEFT(resp_np.patronymic, 1), '.'), '-')",
        responsible_position_name: "COALESCE(resp_pos.name, '-')",
        executor_initials: "COALESCE(CONCAT(exec_np.second_name, ' ', LEFT(exec_np.name, 1), '.', LEFT(exec_np.patronymic, 1), '.'), '-')",
        executor_position_name: "COALESCE(exec_pos.name, '-')",
        document_date: 'd.document_date'
      })}
    FROM work w
    JOIN document d ON w.document_id = d.id
    LEFT JOIN estimate e ON d.id = e.id
    LEFT JOIN room_version rv_est ON w.room_id = rv_est.id
    LEFT JOIN room r_est ON rv_est.room_id = r_est.id
    LEFT JOIN employees resp_emp ON e.responsible_employee_id = resp_emp.id
    LEFT JOIN natural_person resp_np ON resp_emp.id = resp_np.id
    LEFT JOIN position resp_pos ON resp_emp.position_id = resp_pos.id
    LEFT JOIN employees exec_emp ON w.employee_id = exec_emp.id
    LEFT JOIN natural_person exec_np ON exec_emp.id = exec_np.id
    LEFT JOIN position exec_pos ON exec_emp.position_id = exec_pos.id
    WHERE d.type = 'estimate' AND d.is_deleted = 0 AND d.is_confirmed = 1

    UNION ALL

    SELECT
      ${buildSelect({
        work_id: 'w.id',
        document_id: 'd.id',
        document_type: "'act'",
        project_id: 'd.project_id',
        actual_room_id: 'r_act.id',
        category_id: 'w.category_id',
        work_type_id: 'w.work_type_id',
        work_name: 'w.name',
        volume: 'w.volume',
        price_value: 'w.price_value',
        is_price_manual: 'w.is_price_manual',
        estimate_factor: 'NULL',
        contract_price: 'wcp.price',
        works_contract_estimate_factor: 'wc.external_work_coefficient',
        responsible_initials: "COALESCE(CONCAT(resp_np.second_name, ' ', LEFT(resp_np.name, 1), '.', LEFT(resp_np.patronymic, 1), '.'), '-')",
        responsible_position_name: "COALESCE(resp_pos.name, '-')",
        executor_initials: "COALESCE(CONCAT(exec_np.second_name, ' ', LEFT(exec_np.name, 1), '.', LEFT(exec_np.patronymic, 1), '.'), '-')",
        executor_position_name: "COALESCE(exec_pos.name, '-')",
        document_date: 'd.document_date'
      })}
    FROM work w
    JOIN document d ON w.document_id = d.id
    LEFT JOIN act a ON d.id = a.id
    LEFT JOIN room_version rv_act ON w.room_id = rv_act.id
    LEFT JOIN room r_act ON rv_act.room_id = r_act.id
    LEFT JOIN work_contract_price wcp ON a.contract_id = wcp.contract_id AND w.work_type_id = wcp.work_type_id
    LEFT JOIN works_contract wc ON a.contract_id = wc.id
    LEFT JOIN employees resp_emp ON a.responsible_employee_id = resp_emp.id
    LEFT JOIN natural_person resp_np ON resp_emp.id = resp_np.id
    LEFT JOIN position resp_pos ON resp_emp.position_id = resp_pos.id
    LEFT JOIN employees exec_emp ON w.employee_id = exec_emp.id
    LEFT JOIN natural_person exec_np ON exec_emp.id = exec_np.id
    LEFT JOIN position exec_pos ON exec_emp.position_id = exec_pos.id
    WHERE d.type = 'act' AND d.is_deleted = 0 AND d.is_confirmed = 1
  `,

  title: `Сравнение Смет и Актов`,
  description: `Объединяет детализацию работ из подтвержденных смет и актов для сравнения объемов и сумм. Имя комнаты берется из фактической комнаты, связанной через room_version.`,

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
    Documents: {
      sql: `${CUBE}.document_id = ${Documents.id}`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Количество работ (строк)`
    },

    estimateVolume: {
      type: `sum`,
      sql: `CASE WHEN ${CUBE}.document_type = 'estimate' THEN ${CUBE}.volume ELSE 0 END`,
      title: `Объем (Смета)`
    },

    actVolume: {
      type: `sum`,
      sql: `CASE WHEN ${CUBE}.document_type = 'act' THEN ${CUBE}.volume ELSE 0 END`,
      title: `Объем (Акт)`
    },

    estimateSum: {
      type: `sum`,
      sql: `CASE 
              WHEN ${CUBE}.document_type = 'estimate' THEN 
                (CASE 
                   WHEN ${CUBE}.is_price_manual = 1 THEN ${CUBE}.price_value 
                   ELSE ${CUBE}.price_value * COALESCE(${CUBE}.estimate_factor, 1)
                 END) * ${CUBE}.volume 
              ELSE 0 
            END`,
      title: `Сумма (Смета)`
    },

    actSum: {
      type: `sum`,
      sql: `CASE 
              WHEN ${CUBE}.document_type = 'act' THEN 
                (CASE 
                   WHEN ${CUBE}.is_price_manual = 1 THEN ${CUBE}.price_value 
                   ELSE IFNULL(${CUBE}.contract_price, ${CUBE}.price_value)
                 END) * ${CUBE}.volume 
              ELSE 0 
            END`,
      title: `Сумма (Акт)`
    },
    deviationSum: {
      type: `number`,
      sql: `${actSum} - ${estimateSum}`,
      title: `Отклонение, тг`
    },
    deviationPercent: {
        type: `number`,
        sql: `CASE WHEN ${estimateSum} = 0 THEN NULL ELSE (${actSum} - ${estimateSum}) * 100.0 / ${estimateSum} END`,
        title: `Отклонение, %`
    },

    roomFloorSquare: {
        sql: `NULLIF(MAX(${Rooms.RoomsVersion.floorSquare}), 0)`,
        type: `number`,
        title: `Площадь помещения, м²`,
        shown: true
    },

    estimateSumPerSqM: {
        sql: `${estimateSum} / ${CUBE.roomFloorSquare}`,
        type: `number`,
        title: `Цена за м² (Смета)`,
        description: `Общая сумма по смете для помещения, деленная на площадь помещения.`
    },

    actSumPerSqM: {
        sql: `${actSum} / ${CUBE.roomFloorSquare}`,
        type: `number`,
        title: `Цена за м² (Акт)`,
        description: `Общая сумма по актам для помещения, деленная на площадь помещения.`
    },

    deviationSumPerSqM: {
        sql: `${CUBE.actSumPerSqM} - ${CUBE.estimateSumPerSqM}`,
        type: `number`,
        title: `Отклонение за м², тг`,
        description: `Разница между ценой за м² по актам и ценой за м² по смете.`
    },

    deviationPercentPerSqM: {
        sql: `CASE WHEN ${CUBE.estimateSumPerSqM} = 0 THEN NULL ELSE (${CUBE.actSumPerSqM} - ${CUBE.estimateSumPerSqM}) * 100.0 / ${CUBE.estimateSumPerSqM} END`,
        type: `number`,
        title: `Отклонение за м², %`,
        description: `Процентное отклонение цены за м² по актам от цены за м² по смете.`
    }
  },

  dimensions: {
    rowId: {
      sql: `CONCAT(${CUBE}.document_type, '_', ${CUBE}.document_id, '_', ${CUBE}.work_id)`,
      type: `string`,
      primaryKey: true,
      shown: false,
    },
    workId: {
      sql: `work_id`,
      type: `number`,
      shown: false,
    },
    documentId: {
      sql: `document_id`,
      type: `number`,
      shown: false,
    },
     projectId: {
      sql: `project_id`,
      type: `number`,
      shown: false,
    },
     roomId: {
      sql: `room_id`,
      type: `number`,
      shown: true,
      title: 'ID Помещения (факт.)'
    },
     categoryId: {
      sql: `category_id`,
      type: `number`,
      shown: false,
    },
     workTypeId: {
      sql: `work_type_id`,
      type: `number`,
      shown: false,
    },
    documentType: {
      sql: `document_type`,
      type: `string`,
      title: `Тип документа`
    },
    projectName: {
      sql: `${MultiProjects.name}`,
      type: `string`,
      title: `Проект`
    },
     roomName: {
      sql: `COALESCE(${Rooms.name}, 'Без помещения / доп')`,
      type: 'string',
      title: 'Помещение'
    },
     categoryName: {
      sql: `COALESCE(${Categories.name}, 'Без категории')`,
      type: `string`,
      title: `Категория/Этап`
    },
    workTypeName: {
        sql: `${WorkTypes.name}`,
        type: `string`,
        title: `Тип работы`
    },
    workName: {
      sql: `work_name`,
      type: `string`,
      title: `Работа`
    },
    executorName: {
        sql: `executor_initials`,
        type: `string`,
        title: `Исполнитель (ФИО)`
    },
    executorPositionName: {
        sql: `executor_position_name`,
        type: `string`,
        title: `Должность исполнителя`
    },
    responsibleName: {
        sql: `responsible_initials`,
        type: `string`,
        title: `Ответственный (ФИО)`
    },
    responsiblePositionName: {
        sql: `responsible_position_name`,
        type: `string`,
        title: `Должность ответственного`
    },
    documentDate: {
        sql: `document_date`,
        type: `time`,
        title: `Дата документа`
    },

    volume: {
        sql: `volume`,
        type: `number`,
        title: `Объем`
    },
    priceValue: {
        sql: `price_value`,
        type: `number`,
        title: `Цена за ед.`
    },
    totalSum: {
        sql: `${CUBE}.price_value * ${CUBE}.volume`,
        type: `number`,
        title: `Сумма (строка)`
    },
    isPaidLabel: {
      sql: `${Documents.isPaidLabel}`,
      type: `string`,
      title: `Статус оплаты`
    }
  },
});