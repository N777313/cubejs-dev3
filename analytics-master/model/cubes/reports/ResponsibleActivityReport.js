cube(`ResponsibleActivityReport`, {
  sql: `
    WITH BaseProjects AS (
        SELECT
            p.id AS project_id,
            p.name AS project_name,
            p.responsible_user_id,
            (SELECT CONCAT(np.second_name, ' ', LEFT(np.name, 1), '.', LEFT(np.patronymic, 1), '.')
             FROM user u_resp
             JOIN employees e_resp ON u_resp.employee_id = e_resp.id
             JOIN natural_person np ON e_resp.id = np.id
             WHERE u_resp.id = p.responsible_user_id LIMIT 1) AS responsible_name,
            s.name AS funnel_stage_name,
            sg.id AS funnel_id,
            sg.name AS funnel_name,
            ge.date_created AS project_creation_date,
            ge.date_modified AS project_last_modified_date
        FROM project p
        JOIN global_entity ge ON p.global_entity_id = ge.id
        JOIN status s ON p.project_status_id = s.id
        JOIN project_status ps ON p.project_status_id = ps.id
        JOIN status_group sg ON s.status_group_id = sg.id
        WHERE ps.is_active = 1
    )
    -- Поток 1: Сметы (для Дизайна/Работ)
    SELECT
        bp.project_id,
        bp.project_name,
        bp.responsible_user_id,
        bp.responsible_name,
        bp.funnel_id,
        bp.funnel_name,
        bp.funnel_stage_name,
        bp.project_creation_date,
        bp.project_last_modified_date,
        CASE
            WHEN d.name LIKE '%(Смета на дизайн)%' THEN
                COALESCE(
                    (SELECT 'Договор на дизайн'
                     FROM document c_dc
                     WHERE c_dc.project_id = bp.project_id AND c_dc.type = 'design_contract' AND c_dc.is_deleted = 0 AND c_dc.is_confirmed = 1
                     ORDER BY c_dc.document_date DESC, c_dc.id DESC LIMIT 1),
                    'Смета (дизайн) без договора'
                )
            ELSE
                COALESCE(
                    (SELECT CASE wc_linked.type WHEN 'design_contract' THEN 'Договор на дизайн' WHEN 'works_contract' THEN 'Договор на работы' ELSE NULL END
                     FROM works_contract wc_attach
                     JOIN document wc_linked ON wc_attach.id = wc_linked.id
                     WHERE wc_attach.attached_estimate_id = d.id AND wc_linked.project_id = bp.project_id AND wc_linked.is_deleted = 0 AND wc_linked.is_confirmed = 1
                     LIMIT 1),
                    (SELECT 'Договор на дизайн'
                     FROM document c_dc
                     WHERE c_dc.project_id = bp.project_id AND c_dc.type = 'design_contract' AND c_dc.is_deleted = 0 AND c_dc.is_confirmed = 1
                     ORDER BY c_dc.document_date DESC, c_dc.id DESC LIMIT 1),
                    (SELECT 'Договор на работы'
                     FROM document c_wc
                     WHERE c_wc.project_id = bp.project_id AND c_wc.type = 'works_contract' AND c_wc.is_deleted = 0 AND c_wc.is_confirmed = 1
                     ORDER BY c_wc.document_date DESC, c_wc.id DESC LIMIT 1),
                    'Смета без договора'
                )
        END AS activity_type,
        'Смета' AS document_kind,
        CASE
            WHEN d.name LIKE '%(Смета на дизайн)%' THEN
                (SELECT c_dc.document_date
                 FROM document c_dc
                 WHERE c_dc.project_id = bp.project_id AND c_dc.type = 'design_contract' AND c_dc.is_deleted = 0 AND c_dc.is_confirmed = 1
                 ORDER BY c_dc.document_date DESC, c_dc.id DESC LIMIT 1)
            ELSE
                COALESCE(
                    (SELECT wc_linked.document_date
                     FROM works_contract wc_attach
                     JOIN document wc_linked ON wc_attach.id = wc_linked.id
                     WHERE wc_attach.attached_estimate_id = d.id AND wc_linked.project_id = bp.project_id AND wc_linked.is_deleted = 0 AND wc_linked.is_confirmed = 1
                     LIMIT 1),
                    (SELECT c_dc.document_date
                     FROM document c_dc
                     WHERE c_dc.project_id = bp.project_id AND c_dc.type = 'design_contract' AND c_dc.is_deleted = 0 AND c_dc.is_confirmed = 1
                     ORDER BY c_dc.document_date DESC, c_dc.id DESC LIMIT 1),
                    (SELECT c_wc.document_date
                     FROM document c_wc
                     WHERE c_wc.project_id = bp.project_id AND c_wc.type = 'works_contract' AND c_wc.is_deleted = 0 AND c_wc.is_confirmed = 1
                     ORDER BY c_wc.document_date DESC, c_wc.id DESC LIMIT 1)
                )
        END AS contract_document_date,
        d.id AS document_id,
        d.document_status AS document_status,
        d.document_date AS document_date,
        e.sum AS document_sum,
        NULL AS related_contract_id
    FROM BaseProjects bp
    JOIN document d ON bp.project_id = d.project_id AND d.type = 'estimate' AND d.is_deleted = 0
    JOIN estimate e ON d.id = e.id

    UNION ALL

    -- Поток 2: Акты (для Дизайна/Работ)
    SELECT
        bp.project_id,
        bp.project_name,
        bp.responsible_user_id,
        bp.responsible_name,
        bp.funnel_id,
        bp.funnel_name,
        bp.funnel_stage_name,
        bp.project_creation_date,
        bp.project_last_modified_date,
        COALESCE(CASE d_contract_for_act.type WHEN 'design_contract' THEN 'Договор на дизайн' WHEN 'works_contract' THEN 'Договор на работы' ELSE NULL END, 'Акт без договора') AS activity_type,
        'Акт' AS document_kind,
        d_contract_for_act.document_date AS contract_document_date,
        d.id AS document_id,
        d.document_status AS document_status,
        d.document_date AS document_date,
        a.sum AS document_sum,
        a.contract_id AS related_contract_id
    FROM BaseProjects bp
    JOIN document d ON bp.project_id = d.project_id AND d.type = 'act' AND d.is_deleted = 0
    JOIN act a ON d.id = a.id
    LEFT JOIN document d_contract_for_act ON a.contract_id = d_contract_for_act.id AND d_contract_for_act.is_deleted = 0

    UNION ALL

    -- Поток 3: Накладные (для Материалов)
    SELECT
        bp.project_id,
        bp.project_name,
        bp.responsible_user_id,
        bp.responsible_name,
        bp.funnel_id,
        bp.funnel_name,
        bp.funnel_stage_name,
        bp.project_creation_date,
        bp.project_last_modified_date,
        'Договор на материалы' AS activity_type,
        'Накладная' AS document_kind,
        cd_mat.document_date AS contract_document_date,
        d_mi.id AS document_id,
        d_mi.document_status AS document_status,
        d_mi.document_date AS document_date,
        mi.sum * COALESCE(mc.margin_coefficient, 1) AS document_sum,
        mi.contract_id AS related_contract_id
    FROM BaseProjects bp
    JOIN document cd_mat ON bp.project_id = cd_mat.project_id AND cd_mat.type = 'materials_contract' AND cd_mat.is_deleted = 0 AND cd_mat.is_confirmed = 1
    JOIN materials_contract mc ON cd_mat.id = mc.id
    JOIN materials_invoice mi ON mc.id = mi.contract_id
    JOIN document d_mi ON mi.id = d_mi.id AND d_mi.type = 'materials_invoice' AND d_mi.is_deleted = 0
  `,

  joins: {
    UserEmployee: {
      sql: `${CUBE}.responsible_user_id = ${UserEmployee.userId}`,
      relationship: `belongsTo`
    },
    MultiProjects: {
      sql: `${CUBE}.project_id = ${MultiProjects.id}`,
      relationship: `belongsTo`
    }
  },

  measures: {
    totalDocumentSum: {
      type: `sum`,
      sql: `document_sum`,
      format: `currency`,
      title: `Общая сумма по документам`
    },
    documentCount: {
      type: `count`,
      title: `Количество документов`
    },
    distinctProjectCount: {
      type: `countDistinct`,
      sql: `project_id`,
      title: `Количество проектов`
    },
    sumEstimates: {
      type: `sum`,
      sql: `CASE WHEN LOWER(${CUBE}.document_kind) = 'смета' THEN ${CUBE}.document_sum ELSE 0 END`,
      format: `currency`,
      title: `Сумма Смет`
    },
    sumActs: {
      type: `sum`,
      sql: `CASE WHEN LOWER(${CUBE}.document_kind) = 'акт' THEN ${CUBE}.document_sum ELSE 0 END`,
      format: `currency`,
      title: `Сумма Актов`
    },
    sumMaterialInvoices: {
      type: `sum`,
      sql: `CASE WHEN LOWER(${CUBE}.document_kind) = 'накладная' THEN ${CUBE}.document_sum ELSE 0 END`,
      format: `currency`,
      title: `Сумма Накладных`
    }
  },

  dimensions: {
    rowId: {
      sql: `CONCAT(COALESCE(CAST(responsible_user_id AS CHAR), 'null'), '_', CAST(project_id AS CHAR), '_', COALESCE(activity_type, 'no_contract'), '_', COALESCE(document_kind, 'no_kind'), '_', CAST(document_id AS CHAR))`,
      type: `string`,
      primaryKey: true,
      shown: false
    },
    responsibleName: {
      sql: `responsible_name`,
      type: `string`,
      title: `Ответственный`
    },
    projectName: {
      sql: `project_name`,
      type: `string`,
      title: `Название проекта`
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
    funnelStageName: {
      sql: `funnel_stage_name`,
      type: `string`,
      title: `Стадия воронки`
    },
    projectCreationDate: {
      sql: `project_creation_date`,
      type: `time`,
      title: `Дата создания проекта`
    },
    activityType: {
      sql: `activity_type`,
      type: `string`,
      title: `Тип Договора`
    },
    contractDisplay: {
        type: `string`,
        sql: `CASE
                WHEN contract_document_date IS NOT NULL THEN CONCAT(activity_type, ' от ', DATE_FORMAT(contract_document_date, '%d.%m.%Y'))
                ELSE activity_type
              END`,
        title: `Договор / Тип для сметы`
    },
    documentKind: {
      sql: `document_kind`,
      type: `string`,
      title: `Тип Документа`
    },
    documentId: {
      sql: `document_id`,
      type: `number`,
      title: `ID Документа`
    },
    documentStatus: {
      sql: `CASE document_status
        WHEN 'draft' THEN 'Черновик'
        WHEN 'planning' THEN 'Планирование'
        WHEN 'confirmed' THEN 'Подтвержден'
        WHEN 'revision' THEN 'На доработке'
        WHEN 'sent' THEN 'Отправлен'
        WHEN 'signed' THEN 'Подписан'
        ELSE document_status
      END`,
      type: `string`,
      title: `Статус Документа`
    },
    documentDate: {
      sql: `document_date`,
      type: `time`,
      title: `Дата Документа`
    },
    documentSumValue: {
      sql: `document_sum`,
      type: `number`,
      format: `currency`,
      title: `Сумма Документа (строка)`
    },
    relatedContractId: {
      sql: `related_contract_id`,
      type: `number`,
      title: `ID связанного договора`
    },
    projectLastModifiedDate: {
      sql: `project_last_modified_date`,
      type: `time`,
      title: `Дата последнего изменения проекта`
    },
    responsibleUserId: {
      sql: `responsible_user_id`,
      type: `number`,
      shown: false
    },
    projectId: {
      sql: `project_id`,
      type: `number`,
      shown: false
    }
  },

  title: `Отчет по активностям ответственных (Сметы, Акты, Накладные)`,
  description: `Показывает по каждому ответственному стадию воронки проекта, связанные сметы, акты и накладные на материалы, их суммы и статусы.`
});