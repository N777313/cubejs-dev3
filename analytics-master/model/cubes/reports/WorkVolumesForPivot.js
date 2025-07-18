const buildWorkVolumeSelect = (options) => {
  const { wAlias, dAlias, wtAlias, docTypeCode, docTypeLabel } = options;

  return `
      ${wAlias}.id as work_id,
      ${wAlias}.project_id,
      ${wAlias}.category_id,
      ${wAlias}.work_type_id,
      COALESCE(${wAlias}.name, ${wtAlias}.name) as work_name,
      COALESCE(${wAlias}.unit, 'ед.') as unit,
      ${dAlias}.id as document_id,
      '${docTypeCode}' as document_type_code,
      '${docTypeLabel}' as document_type_label,
      ${dAlias}.document_date,
      ${wAlias}.volume
  `;
};

cube(`WorkVolumesForPivot`, {
  sql: `
    SELECT
        ${buildWorkVolumeSelect({
          wAlias: 'w',
          dAlias: 'd',
          wtAlias: 'wt',
          docTypeCode: 'estimate',
          docTypeLabel: 'Смета'
        })}
    FROM work w
    JOIN document d ON w.document_id = d.id AND d.type = 'estimate' AND d.is_confirmed = 1 AND d.is_deleted = 0
    LEFT JOIN work_type wt ON w.work_type_id = wt.id

    UNION ALL

    SELECT
        ${buildWorkVolumeSelect({
          wAlias: 'w',
          dAlias: 'd',
          wtAlias: 'wt',
          docTypeCode: 'act',
          docTypeLabel: 'Акт'
        })}
    FROM work w
    JOIN document d ON w.document_id = d.id AND d.type = 'act' AND d.is_confirmed = 1 AND d.is_deleted = 0
    LEFT JOIN work_type wt ON w.work_type_id = wt.id
  `,

  title: ` `,
  description: `Предоставляет плоский список работ из смет и актов для построения сводной таблицы (pivot) сравнения объемов.`,

  joins: {
    MultiProjects: {
      sql: `${CUBE}.project_id = ${MultiProjects.id}`,
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
    totalVolume: {
      type: `sum`,
      sql: `volume`,
      title: `Объем (сумма)`
    },
     documentCount: {
       type: `countDistinct`,
       sql: `document_id`,
       title: `Кол-во документов`
     },
    estimateTotalVolume: {
        type: `sum`,
        sql: `CASE WHEN ${CUBE}.document_type_code = 'estimate' THEN volume ELSE 0 END`,
        title: `Объем Сметы (Итог)`,
    },
     actTotalVolume: {
        type: `sum`,
        sql: `CASE WHEN ${CUBE}.document_type_code = 'act' THEN volume ELSE 0 END`,
        title: `Объем Актов (Итог)`,
    },
    volumeDifference: {
      type: `number`,
      sql: `${CUBE.actTotalVolume} - ${CUBE.estimateTotalVolume}`,
      title: `Разница`,
    },
  },

  dimensions: {
    rowId: {
      sql: `CONCAT(${CUBE}.document_id, '_', ${CUBE}.work_id)`,
      type: `string`,
      primaryKey: true,
      shown: false,
    },
    workId: {
      sql: `work_id`,
      type: `number`,
      shown: false
    },

    projectName: {
      sql: `${MultiProjects.name}`,
      type: `string`,
      title: `Проект`
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

    documentId: {
      sql: `document_id`,
      type: `number`,
      title: `Номер документа`,
       shown: true
    },
    documentTypeCode: {
      sql: `document_type_code`,
      type: `string`,
    },
    documentTypeLabel: {
      sql: `document_type_label`,
      type: `string`,
      title: `Тип документа`,
    },
    documentDate: {
      sql: `document_date`,
      type: `time`,
      title: `Дата документа`
    },
    documentLabel: {
        sql: `CONCAT(${CUBE.documentTypeLabel}, ' №', ${CUBE.documentId}, ' от ', DATE_FORMAT(${CUBE.documentDate}, '%d.%m.%y'))`,
        type: `string`,
        title: `Док.`
    },
    isPaidLabel: {
      sql: `${Documents.isPaidLabel}`,
      type: `string`,
      title: `Статус оплаты`
    },
    volume: {
        sql: `volume`,
        type: `number`,
        title: `Объем (строка)`
    }
  },
});