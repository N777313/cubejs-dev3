cube('DocumentAuthorUserEmployee', {
  extends: UserEmployee,
  title: "Автор документа"
})

cube('DocumentCreatedEvent', {
  extends: Event,
  sql: `
      SELECT 
        e.*, 
        dce.document_id
      FROM document_created_event dce
      LEFT JOIN ${Event.sql()} e ON dce.id = e.id 
    `,

  title: "Событие создания документа",

  dimensions: {
    documentId: {
      sql: `document_id`,
      type: `number`
    }
  }
})