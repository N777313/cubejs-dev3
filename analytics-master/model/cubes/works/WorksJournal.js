cube(`WorksJournal`, {
  sql: `
    SELECT
      d.document_date AS document_date,
      w.name AS work_name,
      w.volume AS volume,
      w.salary AS employee_sum,
      IFNULL(
          CASE
            WHEN pws.deduction_coefficient IS NOT NULL AND pws.deduction_coefficient > 0
            THEN w.salary * pws.deduction_coefficient
            ELSE NULL
          END,
      0) AS deduction_amount,
      IFNULL(pws.deduction_coefficient, 0) AS deduction_coefficient,
      IFNULL(pws.coefficient, 0) AS work_coefficient,
      a.responsible_employee_id AS responsible_employee_id,
      w.employee_id AS employee_id,
      w.work_type_id AS work_type_id,
      d.id AS act_number,
      w.id AS work_id,
      w.price_value AS client_price,
      emp_np.name AS employee_name,
      emp_np.second_name AS employee_second_name,
      resp_np.name AS responsible_name,
      resp_np.second_name AS responsible_second_name,
      IFNULL(r.name, 'Нет помещения') AS room_name,
      IFNULL(cat.name, 'Нет этапа') AS category_name,
      (
          CASE
              WHEN w.work_type_id IS NOT NULL THEN EXISTS (
                  SELECT 1
                  FROM work w_est
                  JOIN document d_est ON w_est.document_id = d_est.id
                  WHERE d_est.type = 'estimate'
                    AND d_est.project_id = d.project_id
                    AND w_est.work_type_id = w.work_type_id
                    AND d_est.is_confirmed = 1
              )
              ELSE 0
          END
      ) AS is_in_estimate
    FROM
      work w
    JOIN
      document d ON w.document_id = d.id
    JOIN
      act a ON a.id = d.id
    LEFT JOIN
      employees e ON w.employee_id = e.id
    LEFT JOIN
      natural_person emp_np ON e.id = emp_np.id
    LEFT JOIN
      employees resp_e ON a.responsible_employee_id = resp_e.id
    LEFT JOIN
      natural_person resp_np ON resp_e.id = resp_np.id
    LEFT JOIN
      room r ON w.room_id = r.id
    LEFT JOIN
      category cat ON w.category_id = cat.id
    LEFT JOIN (
      SELECT
        sv.employee_id,
        pws.deduction_coefficient,
        pws.coefficient,
        sv.salary_date
      FROM
        salary_version sv
      JOIN
        salary s ON sv.id = s.salary_version_id
      JOIN
        piece_work_salary pws ON s.id = pws.id
    ) pws ON e.id = pws.employee_id AND pws.salary_date <= d.document_date
    WHERE
      d.type = 'ACT'
      AND d.is_deleted = 0
      AND d.is_confirmed = 1
      AND (pws.salary_date IS NULL OR pws.salary_date = (
        SELECT MAX(sv2.salary_date)
        FROM salary_version sv2
        JOIN salary s2 ON sv2.id = s2.salary_version_id
        JOIN piece_work_salary pws2 ON s2.id = pws2.id
        WHERE sv2.employee_id = e.id AND sv2.salary_date <= d.document_date
      ))
  `,

  title: 'Дневник работ',

  joins: {
    Documents: {
      sql: `${CUBE}.act_number = ${Documents.id}`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [CUBE.workId, CUBE.actNumber, CUBE.documentDate]
    },

    volumeSum: {
      type: `sum`,
      sql: `${CUBE.volume}`,
      title: 'Сумма объемов'
    },

    employeeSumAmount: {
      type: `sum`,
      sql: `${CUBE.employeeSum}`,
      title: 'Сумма ЗП'
    },

    deductionAmountSum: {
      type: `sum`,
      sql: `${CUBE.deductionAmount}`,
      title: 'Сумма удержаний'
    },

    clientPriceSum: {
      type: `sum`,
      sql: `${CUBE.clientPrice}`,
      title: 'Общая цена для клиента'
    }
  },

  dimensions: {
    workId: {
      sql: `work_id`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    documentDate: {
      sql: `document_date`,
      type: `time`,
      title: 'Дата'
    },

    workName: {
      sql: `work_name`,
      type: `string`,
      title: 'Работа'
    },

    employeeName: {
      sql: `CONCAT(IFNULL(employee_name, ''), ' ', IFNULL(employee_second_name, ''))`,
      type: `string`,
      title: 'Исполнитель'
    },

    volume: {
      sql: `volume`,
      type: `number`,
      title: 'Объем'
    },

    employeeSum: {
      sql: `employee_sum`,
      type: `number`,
      title: 'ЗП сдельная'
    },

    deductionAmount: {
      sql: `deduction_amount`,
      type: `number`,
      title: 'Удержание'
    },

    deductionCoefficient: {
      sql: `deduction_coefficient`,
      type: `number`,
      title: 'Коэффициент удержания'
    },

    responsibleEmployee: {
      sql: `CONCAT(IFNULL(responsible_name, ''), ' ', IFNULL(responsible_second_name, ''))`,
      type: `string`,
      title: 'Ответственный'
    },

    actNumber: {
      sql: `act_number`,
      type: `number`,
      title: 'Номер акта'
    },

    room: {
      sql: `IFNULL(${CUBE}.room_name, 'Нет помещения')`,
      type: `string`,
      title: 'Помещение'
    },

    stage: {
      sql: `IFNULL(${CUBE}.category_name, 'Нет этапа')`,
      type: `string`,
      title: 'Этап'
    },

    clientPrice: {
      sql: `client_price`,
      type: `number`,
      title: 'Цена клиента'
    },

    workTypeId: {
        sql: `work_type_id`,
        type: `number`,
        shown: false
    },

    isInEstimateFlag: {
      sql: `is_in_estimate`,
      type: `number`,
      shown: false
    },

    workSource: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE.workTypeId} IS NULL`, label: 'Временная работа' },
          { sql: `${CUBE.isInEstimateFlag} = 1`, label: 'Из сметы' },
        ],
        else: { label: `Добавлена в акт` }
      },
      title: 'Источник работы'
    },

    workCoefficient: {
      sql: `work_coefficient`,
      type: `number`,
      title: 'КФ работы'
    }
  }
}); 