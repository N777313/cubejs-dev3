cube('DocumentSnapshotAuthor', {
  extends: UserEmployee,
  title: "Автор версии документа",
})

cube('DocumentSnapshotStatistics', {
  extends: DocumentSnapshot,
  title: "Статистика версий документа",
  joins: {
    Act: {
      sql: `${CUBE}.document_id = ${Act}.id`,
      relationship: `belongsTo`, 
    },
    DocumentSnapshotAuthor: {
      sql: `${CUBE}.user_id = ${DocumentSnapshotAuthor}.user_id`,
      relationship: `belongsTo`
    }
  },

  sql: `
    WITH ranked_snapshots AS (
        SELECT *,
          LAG(document_sum, 1) over w prev_sum,
          COUNT(*) over (PARTITION BY document_id) count
        FROM document_snapshot
        WINDOW w AS (
            PARTITION BY document_id
            ORDER BY date_created ASC
        )
    )
    SELECT * FROM ranked_snapshots
  `,

  dimensions: {
    prevSum: {
      sql: `prev_sum`,
      type: `number`,
      title: "Предыдущая сумма",
    },

    diff: {
      sql: `${CUBE.documentSum} - ${CUBE.prevSum}`,
      type: `number`,
      title: "Разница",
    },

    countInGroup: {
      sql: `count`,
      type: `number`,
      title: "Кол-во версий документа",
    }
  }

})