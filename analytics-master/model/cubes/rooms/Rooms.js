cube(`Rooms`, {
  sql: `
    SELECT 
      id, 
      name,
      project_id 
    FROM room`,
  
  joins: {
    RoomsVersion: {
      sql: `${CUBE.id} = ${RoomsVersion.roomId}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    },
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    name: {
      sql: `name`,
      type: `string`
    },
  }
});
