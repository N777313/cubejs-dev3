cube('DocumentConfirmedEvent', {
    extends: Event,
    sql: `SELECT * FROM document_confirmed_event`,

    title: "Событие подтвержения документа",
    dimensions: {
        documentId: {
            type: `number`,
            sql: `document_id`,
            title: "Номер документа",
        },
        isConfirmed: {
            type: `boolean`,
            sql: `is_confirmed`,
            title: "Подтвержден",
        },
    }
})