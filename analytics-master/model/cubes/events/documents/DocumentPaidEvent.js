cube('DocumentPaidEvent', {
    extends: Event,
    sql: `SELECT * FROM document_paid_event`,

    title: "Событие оплаты документа",
    dimensions: {
        documentId: {
            type: `number`,
            sql: `document_id`,
            title: "Номер документа",
        },
        isPaid: {
            type: `boolean`,
            sql: `is_paid`,
            title: "Оплачен",
        }
    }

})