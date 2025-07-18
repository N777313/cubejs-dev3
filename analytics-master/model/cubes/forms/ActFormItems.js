const { query } = require("../fetch");
const { createValue, createJoin, createDimension } = require('../formSqlGeneration');

asyncModule(async () => {
  const fields = (await query(`
    SELECT id, name, item_type FROM form_item_template
    WHERE entity_type = 'act' AND is_active = 1
  `)) || [];

  const RISK_TEMPLATE_ID = 36;
  const POSITIVE_MARK_TEMPLATE_ID = 37;

  cube(`ActFormItems`, {
    sql: `
      SELECT
        af.id AS id, -- id из act_form, это form_id для form_item
        af.act_id AS act_id,
        f.author_user_id AS author_user_id,
        ${fields.map(field => createValue(field)).join(',\n        ')}
      FROM act_form af
      JOIN form f ON af.id = f.id AND f.type = 'act'
      ${fields.map(field => createJoin(field, 'af')).join('\n      ')}
    `,

  title: "Отметки в формах Актов",

    joins: {
      Act: {
        sql: `${CUBE}.act_id = ${Act.id}`,
        relationship: `belongsTo`
      },
      UserEmployee: { 
        sql: `${CUBE}.author_user_id = ${UserEmployee.userId}`, 
        relationship: `belongsTo`
      }
    },

    dimensions: {
      ...fields.reduce(
        (all, field) => ({
          ...all,
          ...createDimension(field), 
        }),
        {}
      ),

      id: {
        sql: `id`,
        type: `number`,
        primaryKey: true, 
        shown: true, 
        title: "ID Формы Акта"
      },

      actId: {
        sql: `act_id`,
        type: `number`,
        title: "ID Акта"
      },

      authorUserId: {
        sql: `author_user_id`,
        type: `number`,
        shown: false
      },

      riskLowQuality: {
        sql: `IF((${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Низкое качество работ%'), 'Низкое качество работ', '-')`,
        type: 'string',
        title: 'Риск: Низкое качество работ'
      },
      riskVolumeExceeded: {
        sql: `IF((${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Завысил объемы%'), 'Завысил объемы', '-')`,
        type: 'string',
        title: 'Риск: Завысил объемы'
      },
      riskConflict: {
        sql: `IF((${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Конфликтный%'), 'Конфликтный', '-')`,
        type: 'string',
        title: 'Риск: Конфликтный'
      },
      riskMessOnSite: {
        sql: `IF((${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Беспорядок на объекте%'), 'Беспорядок на объекте', '-')`,
        type: 'string',
        title: 'Риск: Беспорядок на объекте'
      },
      riskJournalRemarks: {
        sql: `IF((${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Замечания к журналу%'), 'Замечания к журналу', '-')`,
        type: 'string',
        title: 'Риск: Замечания к журналу'
      },

      positiveSpeed: {
        sql: `IF((${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Скорость работы%'), 'Скорость работы', '-')`,
        type: 'string',
        title: 'Плюс: Скорость работы'
      },
      positiveQuality: {
        sql: `IF((${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Высокое качество%'), 'Высокое качество', '-')`,
        type: 'string',
        title: 'Плюс: Высокое качество'
      },
      positiveJournalKeeping: {
        sql: `IF((${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Хорошо ведет журнал работ%'), 'Хорошо ведет журнал работ', '-')`,
        type: 'string',
        title: 'Плюс: Хорошо ведет журнал'
      },
      positiveAlwaysInTouch: {
        sql: `IF((${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Всегда на связи%'), 'Всегда на связи', '-')`,
        type: 'string',
        title: 'Плюс: Всегда на связи'
      },
      
      authorUserName: { 
        sql: `${UserEmployee.initials}`, 
        type: 'string',
        title: 'Кто заполнил опрос (инициалы)'
      },

      actFullStatusLabel: {
        sql: `${Act.actStatusLabel}`,
        type: 'string',
        title: 'Статус Акта'
      },

      actDocumentDate: {
        sql: `${Act.documentDate}`,
        type: 'time',
        title: 'Дата Акта'
      },

      projectName: {
        sql: `${Act.MultiProjects.name}`, 
        type: 'string',
        title: 'Проект'
      },

      projectResponsibleName: {
        sql: `${Act.MultiProjects.ProjectResponsible.initials}`, 
        type: 'string',
        title: 'Ответственный за проект (инициалы)'
      },

      actResponsibleEmployeeName: {
        sql: `${Act.responsibleName}`, 
        type: 'string',
        title: 'Исполнитель (по Акту)'
      }
    },

    measures: {
      count: {
        type: `count`,
        title: "Количество форм актов"
      },

      countAnyRiskMarked: {
        type: `count`,
        filters: [{
          sql: `(${CUBE}.field_${RISK_TEMPLATE_ID} IS NOT NULL AND ${CUBE}.field_${RISK_TEMPLATE_ID} != 'Не установлено' AND ${CUBE}.field_${RISK_TEMPLATE_ID} != '')`
        }],
        title: "Кол-во форм с любым риском"
      },

      countAnyPositiveMarked: {
        type: `count`,
        filters: [{
          sql: `(${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} IS NOT NULL AND ${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} != 'Не установлено' AND ${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} != '')`
        }],
        title: "Кол-во форм с любым плюсом"
      },

      countRiskLowQuality: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Низкое качество работ%'` }],
        title: "Кол-во: Риск Низкое качество"
      },
      countRiskVolumeExceeded: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Завысил объемы%'` }],
        title: "Кол-во: Риск Завысил объемы"
      },
      countRiskConflict: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Конфликтный%'` }],
        title: "Кол-во: Риск Конфликтный"
      },
      countRiskMessOnSite: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Беспорядок на объекте%'` }],
        title: "Кол-во: Риск Беспорядок"
      },
      countRiskJournalRemarks: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${RISK_TEMPLATE_ID} LIKE '%Замечания к журналу%'` }],
        title: "Кол-во: Риск Замечания к журналу"
      },
      
      countPositiveSpeed: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Скорость работы%'` }],
        title: "Кол-во: Плюс Скорость"
      },
      countPositiveQuality: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Высокое качество%'` }],
        title: "Кол-во: Плюс Качество"
      },
      countPositiveJournalKeeping: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Хорошо ведет журнал работ%'` }],
        title: "Кол-во: Плюс Журнал"
      },
      countPositiveAlwaysInTouch: {
        type: `count`,
        filters: [{ sql: `${CUBE}.field_${POSITIVE_MARK_TEMPLATE_ID} LIKE '%Всегда на связи%'` }],
        title: "Кол-во: Плюс Связь"
      }
    },

    preAggregations: {
      main: {
        type: `originalSql`,
      }
    }
  });
});
