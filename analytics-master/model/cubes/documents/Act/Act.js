cube(`ActResponsibleEmployee`, {
  extends: UserEmployee,
  title: 'Ответственный сотрудник акта'
})

cube(`Act`, {
  extends: Documents,
  title: 'Акт',
  sql: `
    SELECT
        d.*,
        a.sum,
        a.contract_id,
        a.responsible_employee_id,
        (SELECT SUM(COALESCE(w.salary, 0)) FROM work w WHERE w.document_id = a.id) as act_raw_salary_sum_calc
    FROM act a
    LEFT JOIN (${Documents.sql()}) d ON a.id = d.id
  `,

  joins: {
    Works: {
      relationship: `hasMany`,
      sql: `${CUBE.id} = ${Works.documentId}`
    },
    MultiProjects: {
      relationship: `belongsTo`,
      sql: `${CUBE.projectId} = ${MultiProjects.id}`
    },
    Contract: {
      relationship: `belongsTo`,
      sql: `${CUBE.contractId} = ${Contract.id}`
    },
    WorksContract: {
      relationship: `belongsTo`,
      sql: `${CUBE.contractId} = ${WorksContract.id}`
    },
    ActResponsibleEmployee: {
      sql: `${ActResponsibleEmployee.id} = ${CUBE}.responsible_employee_id`,
      relationship: `hasOne`
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id],
      title: 'Количество'
    },
    actSum: {
      type: `sum`,
      sql: `sum`,
      format: 'currency',
      title: 'Сумма (всего)'
    },
    confirmedActSum: {
      type: `sum`,
      sql: `sum`,
      format: `currency`,
      title: 'Сумма (Подтвержденные)',
      filters: [
        {
          sql: `${CUBE.isConfirmed}`
        }
      ]
    },
    actAvgSum: {
      type: `number`,
      sql: `${CUBE.confirmedActSum} / ${CUBE.count}`,
      format: `currency`,
      title: `Средняя сумма актов`
    }
  },

  dimensions: {
    sum: {
      sql: `sum`,
      type: `number`,
      title: 'Сумма акта'
    },
    contractId: {
      sql: `contract_id`,
      type: `number`,
      shown: false,
    },
    responsibleName: {
      sql: `${ActResponsibleEmployee.initials}`,
      type: `string`,
      title: `Ответственный (Акт)`
    },
    actStatus: {
      sql: `IF(
        ${CUBE.isShared},
        IF(${CUBE.isPaid}, 'PAID', 'SHARED'),
        document_status
      )`,
      type: `string`,
      shown: false,
    },
    actStatusLabel: {
      type: `string`,
      title: `Статус Акта`,
      sql: `
        IF(
          ${CUBE.isShared},
          IF(${CUBE.isPaid}, 'Оплачен', 'Отправлен'),
          ${CUBE.statusLabel}
        )
      `,
    }
  }
});
