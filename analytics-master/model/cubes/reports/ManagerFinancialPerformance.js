const allUnionColumns = [
  'client_revenue',
  'act_piece_rate_salary_cost',
  'act_piece_rate_deduction_cost',
  'gross_profit_bonus',
  'bonus_deduction',
  'measurement_bonus',
  'employee_piece_work_accrued',
  'other_bonus_accrued',
  'piece_work_deduction',
  'material_invoice_profit'
];

const buildUnionSelect = (options) => {
  return allUnionColumns.map(colName => {
    const value = options[colName] || `0`;
    return `  ${value} as ${colName}`;
  }).join(',\n');
};

cube(`ManagerFinancialPerformance`, {
  sql: `
    -- 1. Данные из Act (Доход клиенту - ОТНОСИТСЯ К СОЗДАТЕЛЮ АКТА)
    SELECT
      act_creator_user.employee_id as employee_id,
      'Act' as source_type,
      a.id as source_id,
      a.id as related_act_id,
      d.document_date as period_date,
      d.project_id as project_id,
    ${buildUnionSelect({
      client_revenue: 'IF(d.is_confirmed = 1 AND d.is_deleted = 0 AND d.is_paid = 1, a.sum, 0)'
    })}
    FROM ${Act.sql()} a
    LEFT JOIN document d ON a.id = d.id
    LEFT JOIN document_created_event dce ON d.id = dce.document_id
    JOIN event ev ON dce.id = ev.id
    JOIN user act_creator_user ON ev.user_id = act_creator_user.id
    WHERE act_creator_user.employee_id IS NOT NULL

    UNION ALL

    -- 2. Данные из EmployeeOperation (НАЧИСЛЕННАЯ/УДЕРЖАННАЯ сдельная ЗП - ОТНОСИТСЯ К СОЗДАТЕЛЮ АКТА)
    SELECT
      act_creator_user.employee_id as employee_id,
      'EmployeeSalaryOperationPieceWork' as source_type,
      o.id as source_id,
      base_doc.id as related_act_id,
      o.period_date as period_date,
      eo.project_id as project_id,
    ${buildUnionSelect({
      act_piece_rate_salary_cost: 'CASE WHEN eo.is_deduction = 0 THEN o.sum ELSE 0 END',
      act_piece_rate_deduction_cost: 'CASE WHEN eo.is_deduction = 1 THEN o.sum ELSE 0 END'
    })}
    FROM operation o
    JOIN employee_operation eo ON o.id = eo.id
    JOIN document base_doc ON o.base_document = base_doc.id AND base_doc.type = 'act'
    JOIN document_created_event dce ON base_doc.id = dce.document_id
    JOIN event ev ON dce.id = ev.id
    JOIN user act_creator_user ON ev.user_id = act_creator_user.id
    WHERE o.is_deleted = 0
      AND o.is_confirmed = 1
      AND o.sign_type = 'INCOME'
      AND eo.employee_operation_type = 'piece_work_payroll'
      AND base_doc.is_paid = 1
      AND act_creator_user.employee_id IS NOT NULL

    UNION ALL

    -- 3. Данные из EmployeeSalaryOperation (Премии, Прочие удержания/начисления - ОТНОСЯТСЯ К СОТРУДНИКУ)
    SELECT
      eo.employee_id as employee_id,
      'EmployeeSalaryOperation' as source_type,
      eo.id as source_id,
      CASE WHEN base_doc_check.type = 'act' THEN o.base_document ELSE NULL END as related_act_id,
      o.period_date as period_date,
      eo.project_id as project_id,
    ${buildUnionSelect({
      gross_profit_bonus: "CASE WHEN eo.employee_operation_type = 'bonus' AND eo.bonus_type = 'on_every_act' AND eo.is_deduction = 0 AND o.sign_type = 'income' AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END",
      bonus_deduction: "CASE WHEN eo.employee_operation_type = 'bonus' AND eo.is_deduction = 1 AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END",
      measurement_bonus: "CASE WHEN eo.employee_operation_type = 'bonus' AND eo.bonus_type = 'on_contract_sign' AND eo.is_deduction = 0 AND o.sign_type = 'income' AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END",
      employee_piece_work_accrued: "CASE WHEN eo.employee_operation_type = 'piece_work_payroll' AND eo.is_deduction = 0 AND o.sign_type = 'income' AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END",
      other_bonus_accrued: "CASE WHEN eo.employee_operation_type = 'bonus' AND eo.bonus_type = 'manual_works' AND eo.is_deduction = 0 AND o.sign_type = 'income' AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END",
      piece_work_deduction: "CASE WHEN eo.employee_operation_type = 'piece_work_payroll' AND eo.is_deduction = 1 AND o.sign_type = 'INCOME' AND o.is_confirmed = 1 AND o.is_deleted = 0 THEN o.sum ELSE 0 END"
    })}
    FROM (${EmployeeSalaryOperation.sql()}) eo
    LEFT JOIN operation o ON eo.id = o.id
    LEFT JOIN document base_doc_check ON o.base_document = base_doc_check.id
    WHERE NOT (
          o.sign_type = 'INCOME'
      AND eo.employee_operation_type = 'piece_work_payroll'
      AND base_doc_check.type = 'act'
      AND base_doc_check.is_paid = 1
    )

    UNION ALL

    -- 4. Данные из MaterialInvoice (Прибыль с накладных - ОТНОСИТСЯ К СОЗДАТЕЛЮ НАКЛАДНОЙ)
    SELECT
      invoice_creator_user.employee_id as employee_id,
      'MaterialInvoice' as source_type,
      mio.base_document as source_id,
      NULL as related_act_id,
      mio.period_date as period_date,
      mio.project_id as project_id,
    ${buildUnionSelect({
      material_invoice_profit: 'mio.profit'
    })}
    FROM (${MaterialInvoiceManagementOperation.sql()}) mio
    JOIN document d ON mio.base_document = d.id AND d.type = 'materials_invoice'
    JOIN (
        SELECT document_id, MIN(id) as first_hist_id
        FROM document_history GROUP BY document_id
    ) dh_min ON mio.base_document = dh_min.document_id
    JOIN document_history dh ON dh.id = dh_min.first_hist_id
    JOIN user invoice_creator_user ON dh.user_id = invoice_creator_user.id
    WHERE invoice_creator_user.employee_id IS NOT NULL
      AND d.is_deleted = 0
  `,

  title: `Финансовая результативность сотрудников (Агрегированный)`,
  description: `Агрегирует ключевые финансовые показатели по сотрудникам. Доход/ЗП по актам относятся к создателю акта. Прибыль по накладным относится к создателю накладной.`,

  joins: {
    Employees: {
      sql: `${CUBE}.employee_id = ${Employees}.id`,
      relationship: `belongsTo`
    },
    MultiProjects: {
        sql: `${CUBE}.project_id = ${MultiProjects.id}`,
        relationship: `belongsTo`
    }
  },

  measures: {
    totalClientRevenue: {
      type: `sum`, sql: `client_revenue`, title: `Доход по оплаченным актам клиенту`,
      description: `Сумма подтвержденных и оплаченных актов (для клиента), созданных данным сотрудником.`
    },
    totalActPieceRateSalaryCost: {
      type: `sum`, sql: `act_piece_rate_salary_cost`, title: `Начислено сдельной ЗП по актам (стоимость)`,
      description: `Сумма начисленной сдельной ЗП (не удержание) по операциям, базовым документом которых является оплаченный Акт, созданный данным сотрудником.`
    },
    totalActPieceRateDeductionCost: {
      type: `sum`, sql: `act_piece_rate_deduction_cost`, title: `Удержано сдельной ЗП по актам (стоимость)`,
      description: `Сумма удержаний из сдельной ЗП по операциям, базовым документом которых является оплаченный Акт, созданный данным сотрудником.`
    },
    totalGrossProfitBonus: {
      type: `sum`, sql: `gross_profit_bonus`, title: `Премия с ВП (начислено сотруднику)`,
      description: `Сумма начисленной премии с ВП (тип 'on_every_act', не удержание) по подтвержденным операциям.`
    },
    totalBonusDeduction: {
      type: `sum`, sql: `bonus_deduction`, title: `Удержание с премии (сотрудника)`,
      description: `Сумма удержаний из премий (тип 'bonus', удержание) по подтвержденным операциям конкретного сотрудника.`
    },
    totalMeasurementBonus: {
      type: `sum`, sql: `measurement_bonus`, title: `Премия за замер (начислено сотруднику)`,
      description: `Сумма начисленной премии за замер (тип 'on_contract_sign', не удержание) по подтвержденным операциям конкретного сотрудника.`
    },
    totalOtherBonusAccrued: {
      type: `sum`, sql: `other_bonus_accrued`, title: `Прочие премии (начислено сотруднику)`,
      description: `Сумма прочих начисленных премий (тип 'manual_works', не удержание) по подтвержденным операциям.`
    },
    totalMaterialInvoiceProfit: {
       type: `sum`, sql: `material_invoice_profit`, title: `Прибыль по накладным (материалы)`,
       description: `Сумма расчетной прибыли по подтвержденным накладным на материалы, созданным данным сотрудником.`
    },

    
    totalActSalaryCost: {
        type: `number`,
        sql: `COALESCE(${CUBE.totalActPieceRateSalaryCost}, 0) + COALESCE(${CUBE.totalActPieceRateDeductionCost}, 0)`,
        title: `Общие затраты сдельной ЗП по актам (создателя)`,
        description: `Общая сумма начислений и удержаний сдельной ЗП по операциям, связанным с оплаченными актами, созданными данным сотрудником.`,
        format: 'currency'
    },
    profitAfterBonuses: {
      type: `number`,
      sql: `
        COALESCE(${CUBE.totalClientRevenue}, 0) 
        - COALESCE(${CUBE.totalActPieceRateSalaryCost}, 0) 
        - COALESCE(${CUBE.totalActPieceRateDeductionCost}, 0) 
        - COALESCE(${CUBE.totalGrossProfitBonus}, 0) 
        - COALESCE(${CUBE.totalMeasurementBonus}, 0) 
        - COALESCE(${CUBE.totalOtherBonusAccrued}, 0) 
        - COALESCE(${CUBE.totalBonusDeduction}, 0)
      `,
      title: `Сумма прибыли после вычета премий`,
      description: `Прибыльность акта: Доход по акту - (Начисл. + Удерж. сдельная ЗП по акту) - (Начисл. + Удерж. Премии сотруднику).`,
      format: 'currency'
    }
  },

  dimensions: {
    employeeId: {
      sql: `employee_id`,
      type: `number`,
      primaryKey: true,
      shown: true,
      title: `ID Сотрудника`
    },
    employeeFullName: {
      sql: `${Employees.initials}`,
      type: `string`,
      title: `Сотрудник (Инициалы)`
    },
    employeePosition: {
      sql: `${Employees.positionName}`,
      type: `string`,
      title: `Должность сотрудника`
    },
    periodDate: {
        sql: `period_date`,
        type: `time`,
        title: `Дата операции/документа`
    },
    sourceType: {
        sql: `source_type`,
        type: `string`,
        title: `Источник данных`
    },
    sourceId: {
        sql: `source_id`,
        type: `number`,
        title: `ID источника (Акт/Операция/Накладная)`
    },
    relatedActId: {
      sql: `related_act_id`,
      type: `number`,
      title: `ID связанного Акта`
    },
    projectId: {
      sql: `project_id`,
      type: `number`,
      title: `ID Проекта (Источник)`
    },
    projectName: {
      sql: `${MultiProjects.name}`,
      type: `string`,
      title: `Проект (Источник)`
    }
  },

}); 