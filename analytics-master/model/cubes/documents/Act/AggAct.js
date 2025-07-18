cube(`AggAct`, {
    title: `Аггрегированные Акты`,
    sql: `
        SELECT SUM(act.sum) as act_sum, doc.project_id as pr_id, contract_id FROM act
        LEFT JOIN document as doc ON doc.id = act.id
        WHERE doc.is_confirmed = 1
        GROUP BY doc.project_id, contract_id
        ORDER BY doc.project_id DESC
    `,

    joins: {
        WorksContract: {
            relationship: `belongsTo`,
            sql: `${CUBE.contractId} = ${WorksContract.id}`,
            
        }
    },

    dimensions: {
        id: {
            sql: `CONCAT(pr_id, '-', contract_id)`,
            type: `string`,
            primaryKey: true,
            shown: true
        },

        sum: {
            sql: `act_sum`,
            type: `number`,
            title: `Сумма`
        },

        contractId: {
            sql: `contract_id`,
            type: `number`,
            title: `ID Договора`
        },

        projectId: {
            sql: `pr_id`,
            type: `number`,
            title: `ID проекта`
        }
    },

    measures: {
        commonSum: {
            type: `sum`,
            sql: `act_sum`
        }
    }
});