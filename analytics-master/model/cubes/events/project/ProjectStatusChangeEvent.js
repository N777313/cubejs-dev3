cube(`ProjectStatusChangePreviousEvent`, {
  extends: ProjectStatusChangeEvent,
  title: "Прошлое событие изменения статуса проекта",

})

cube(`ProjectStatusChangeEvent`, {
  extends: Event,
  sql: `
    SELECT e.*, 
        ps.name ps_name,
        ps.order ps_order,
        ps.status_type ps_type,
        psg.name psg_name,
        psce.project_id,
        psce.status_id,
        psce.previous_event_id,
        e.id = LAST_VALUE(e.id) OVER(PARTITION BY psce.project_id ORDER BY e.date_created) is_last_by_project,
        e.id = LAST_VALUE(e.id) OVER(
          PARTITION BY psce.project_id, psg.id 
          ORDER BY e.date_created 
          RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) is_last_by_psg,
        FIRST_VALUE(e.date_created) OVER(PARTITION BY psce.project_id ORDER BY e.date_created) first_date_by_project
    FROM (
      SELECT pce.*, NULL previous_event_id FROM project_created_event pce
      UNION ALL
      SELECT * FROM project_status_changed_event
    ) psce
    LEFT JOIN event e ON e.id = psce.id
    LEFT JOIN ${ProjectStatus.sql()} ps ON ps.id = psce.status_id
    LEFT JOIN ${ProjectStatusGroup.sql()} psg ON ps.status_group_id = psg.id
    `,
  title: "Событие изменения статуса проекта",
  joins: {
    MultiProjects: {
      sql: `${MultiProjects}.id = ${CUBE}.project_id`,
      relationship: `belongsTo`
    },
    ProjectStatusChangePreviousEvent: {
      sql: `${ProjectStatusChangePreviousEvent}.id = ${CUBE}.previous_event_id`,
      relationship: `hasOne`
    }
  },

  measures: {
    countDistinct: {
      sql: `project_id`,
      type: `countDistinct`,
      title: "Кол-во уникальных",
    },
    countSuccessProjects: {
      sql: `project_id`,
      type: `count`,
      filters: [{
        sql: `ps_type = 'success'`
      }]
    },
    countFaieldProjects: {
      sql: `project_id`,
      type: `count`,
      filters: [{
        sql: `ps_type = 'fail'`
      }]
    },
    percentage: {
      sql: `${CUBE.countDistinct} / SUM(${CUBE.countDistinct}) over () * 100`,
      type: `number`,
      format: 'percent',
      title: "Процент",
    },
    lag: {
      type: `number`,
      sql: `LAG(${CUBE.countDistinct}, 1) over (order by ${CUBE.statusOrder} asc)`,
      title: "Задержка",
    },
    ratio: {
      sql: `(${CUBE.countDistinct} / FIRST_VALUE(COUNT(DISTINCT project_id)) over (order by ${CUBE.statusOrder} asc)) * 100`,
      type: `number`,
      format: 'percent',
      title: "Процент от общего",
    },
    daysInStatusSum: {
      sql: `${CUBE.daysInStatus}`,
      type: `sum`,
      title: "Кол-во дней в статусе"
    }

  },

  dimensions: {
    projectId: {
      sql: `project_id`,
      type: `number`
    },
    isLastByProject: {
      sql: `is_last_by_project`,
      type: `number`
    },
    isLastByProjectStatusGroup: {
      sql: `is_last_by_psg`,
      type: `number`  
    },
    daysInStatus: {
      sql: `IF(
        ${ProjectStatusChangePreviousEvent.dateCreated} IS NULL, 
        TIMESTAMPDIFF(DAY, CURDATE(), ${CUBE.dateCreated}),
        TIMESTAMPDIFF(DAY, ${CUBE.dateCreated}, ${ProjectStatusChangePreviousEvent.dateCreated})
        )
      `,
      type: `number`,
      title: "Кол-во дней с момента перемещения",
    },
    dayTotal: {
      sql: `TIMESTAMPDIFF(DAY, first_date_by_project, ${CUBE.dateCreated})`,
      type: `number`,
      title: "Кол-во дней с момента создания",
    },
    statusOrder: {
      sql: `ps_order`,
      type: `number`,
      title: "Порядок статуса",
    },
    statusName: {
      sql: `ps_name`,
      type: `string`,
      title: "Название статуса",
    },
    statusGroupName: {
      sql: `psg_name`,
      type: `string`,
      title: "Название воронки",
    },
    statusFullName: {
      sql: `CONCAT(${CUBE.statusGroupName}, " - ", ${CUBE.statusName})`,
      type: `string`,
      title: "Воронка - статус",
    }
  }

})