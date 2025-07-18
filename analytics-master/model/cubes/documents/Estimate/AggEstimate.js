cube(`AggEstimate`, {
    title: `Аггрегированные Сметы`,
    sql: `
        SELECT SUM(estimate.sum) as estimate_sum, doc.project_id as pr_id FROM estimate
        LEFT JOIN document as doc ON doc.id = estimate.id
        GROUP BY doc.project_id
        ORDER BY doc.project_id DESC
    `,

    joins: {
        MultiProjects: {
            relationship: `belongsTo`,
            sql: `${CUBE.projectId} = ${MultiProjects.id}`,
        },
    },

    dimensions: {
        sum: {
            sql: `estimate_sum`,
            type: `number`,
            title: `Сумма`
        },

        projectId: {
            sql: `pr_id`,
            type: `number`,
            title: `ID проекта`
        }
    }

});