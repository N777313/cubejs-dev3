cube('EmployeeProjectAttachedEvent', {
    extends: Event,
    sql: `SELECT * FROM employee_project_attached_event`,

    title: "Событие прикрепления сотрудника к проекту",

    dimensions: {
        employeeId: {
            type: `number`,
            sql: `employee_id`,
            title: "№ сотрудника",
        },
        projectId: {
            type: `number`,
            sql: `project_id`,
            title: "№ проекта",
        },
        isAttached: {
              type: `boolean`,
            sql: `is_attached`,
            title: "Прикреплен",
        }
    }
})