cube(`RoomsVersion`, {
  sql: `
    SELECT 
        id,
        room_type_id,
        room_layout_id,
        floor_square,
        room_id
    FROM room_version`,
  
  joins: {
    Works: {
      sql: `${CUBE.id} = ${Works.roomId}`,
      relationship: `hasMany`
    },
    Rooms: {
      sql: `${CUBE.roomId} = ${Rooms.id}`,
      relationship: `hasMany`
    },
    RoomsLayout: {
      sql: `${CUBE.roomLayoutId} = ${RoomsLayout.id}`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    },

    floorSquareSum: {
      type: `sum`,
      sql: `${CUBE.floorSquare}`,
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    roomId: {
      sql: `room_id`,
      type: `number`
    },

    roomLayoutId: {
      sql: `room_layout_id`,
      type: `number`
    },

    floorSquare: {
      sql: `floor_square`,
      type: `number`
    },
  }
});
