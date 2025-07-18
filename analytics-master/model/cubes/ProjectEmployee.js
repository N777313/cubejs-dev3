cube('ProjectEmployee', {
    sql: `SELECT * FROM project_employee`,

    joins: {
        Employees: {
            relationship: `hasMany`,
            sql: `${Employees.id} = ${ProjectEmployee.employeeId}`
        },
        MultiProjects: {
            relationship: `hasMany`,
            sql: `${MultiProjects.id} = ${ProjectEmployee.projectId}`
        }
    },

    dimensions: {
        projectId: {
            type: `number`,
            primaryKey: true,
            sql: `project_id`
        },
        employeeId: {
            type: `number`,
            primaryKey: true,
            sql: `employee_id`
        }
    }
})