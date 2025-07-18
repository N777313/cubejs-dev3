cube(`Documents`, {
  title: 'Документ',
  sql: `
    SELECT
        d.id,
        d.name,
        d.type,
        d.date_created,
        d.date_modified,
        d.document_date,
        d.project_id,
        d.is_confirmed,
        d.is_deleted,
        d.description,
        d.is_shared,
        d.is_paid,
        d.document_status,
        dce.user_id
    FROM document d
    LEFT JOIN ${DocumentCreatedEvent.sql()} dce ON dce.document_id = d.id
    `,

  joins: {
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE.projectId} = ${MultiProjects.id}`
    },
    Estimate: {
      relationship: 'hasOne',
      sql: `${CUBE.id} = ${Estimate.id}`
    },
    Act: {
      relationship: `hasOne`,
      sql: `${CUBE.id} = ${Act.id}`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, dateCreated, dateModified, documentDate],
      title: 'Количество'
    },
    confirmedCount: {
      type: `count`,
      sql: `
        ${CUBE.isConfirmed}
      `,
      title: 'Количество подтвержденных'
    },
    maxDocumentDate: {
      type: `max`,
      sql: `${CUBE.documentDate}`,
      title: 'Последняя дата'
    },
    minDocumentDate: {
      type: `min`,
      sql: `${CUBE.documentDate}`,
      title: 'Первая дата'
    },
    minActDocumentDate: {
      type: `min`,
      sql: `${Documents.documentDate}`,
      filters: [{
        sql: `${Documents.type} = 'Act'`
      }]
    }
  },

  segments: {
    confirmed: {
      sql: `${CUBE}.is_confirmed`,
      title: 'Подтвержденные'
    },
    acts: {
      sql: `${CUBE}.Type = 'Act'`,
      title: 'Акты'
    },
    estimates: {
      sql: `${CUBE}.Type = 'Estimate'`,
      title: 'Сметы'
    }
  },

  dimensions: {
    id: {
      sql: `${CUBE}.id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: 'Номер'
    },

    projectId: {
      sql: `project_id`,
      type: `number`
    },

    name: {
      sql: `${CUBE}.name`,
      type: `string`,
      title: 'Название'
    },

    nameWithDate: {
      sql: `CONCAT(${CUBE.typeLabel}, ' от ', DATE_FORMAT(${CUBE.documentDate}, '%e.%m.%y'))`,
      type: `string`,
      title: 'Название с датой'
    },

    nameWithDescription: {
      sql: `CONCAT(IFNULL(${CUBE.name}, ${CUBE.typeLabel}), ' (', ${CUBE.description}, ')')`,
      type: `string`
    },

    dateWithDescription: {
      sql: `CONCAT(DATE_FORMAT(${CUBE.documentDate}, '%e.%m.%y'), ' (', ${CUBE.description}, ')')`,
      type: `string`
    },

    type: {
      sql: `${CUBE}.type`,
      type: `string`,
      title: 'Тип (системный)'
    },

    typeLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE.type} = 'act'`, label: 'Акт'},
          {sql: `${CUBE.type} = 'estimate'`, label: 'Смета'},
          {sql: `${CUBE.type} = 'transaction'`, label: 'Транзакция'},
          {sql: `${CUBE.type} = 'tool_loan'`, label: 'Инструмент'},
          {sql: `${CUBE.type} = 'adjustment'`, label: 'Корректировка'},
          {sql: `${CUBE.type} = 'materials_invoice'`, label: 'Накладная на материалы'}
        ],
      },
      title: 'Тип'
    },

    dateCreated: {
      sql: `${CUBE}.date_created`,
      type: `time`,
      title: 'Дата создания'
    },

    dateModified: {
      sql: `${CUBE}.date_modified`,
      type: `time`,
      title: 'Дата модификации'
    },

    documentDate: {
      sql: `${CUBE}.document_date`,
      type: `time`,
      title: 'Дата документа'
    },

    weekNumber: {
      sql: `CONCAT(
               YEAR(${CUBE}.document_date), 
               '-', 
               LPAD(WEEK(${CUBE}.document_date, 1), 2, '0')
            )`,
      type: `string`,
      title: 'Год-неделя'
    },
    
    weekLabel: {
      sql: `CONCAT(
               YEAR(${CUBE}.document_date), 
               '-', 
               LPAD(WEEK(${CUBE}.document_date, 1), 2, '0'), 
               ' неделя'
            )`,
      type: `string`,
      title: 'Год-номер недели (метка)'
    },

    isPaid: {
      sql: `${CUBE}.is_paid`,
      type: `boolean`,
    },

    isPaidLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE.isPaid}`, label: 'Оплачен'},
        ],
        else: {label: `Не оплачен`}
      },
      title: 'Оплачен'
    },

    isShared: {
      sql: `${CUBE}.is_shared`,
      type: `boolean`
    },

    isSharedLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE.isShared}`, label: 'Отправлен'},
        ],
        else: {label: `Не отправлен`}
      },
      title: 'Отправлен'
    },

    isConfirmed: {
      sql: `${CUBE}.is_confirmed`,
      type: `boolean`,
      title: 'Подтвержден'
    },

    isDeleted: {
      sql: `${CUBE}.is_deleted`,
      type: `boolean`,
      title: 'Удален'
    },

    status: {
      sql: `${CUBE}.document_status`,
      type: `string`,
      title: 'Статус'
    },

    statusLabel: {
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE.status} = 'draft'`, label: 'Черновик'},
          {sql: `${CUBE.status} = 'planning'`, label: 'Планирование'},
          {sql: `${CUBE.status} = 'ready'`, label: 'Подтвержден прорабом'},
          {sql: `${CUBE.status} = 'revision'`, label: 'На доработке'},
          {sql: `${CUBE.status} = 'confirmed'`, label: 'Подтвержден менеджером'},
        ],
        else: {label: `Неизвестно`}
      },
      title: 'Статус'

    },

    description: {
      sql: `${CUBE}.description`,
      type: `string`,
      title: 'Описание'
    },

    userId: {
      sql: `user_id`,
      type: `number`
    }
  }
});
