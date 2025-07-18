const { createPool } = require('mysql2');

const pool = createPool({
  host: process.env.CUBEJS_DB_HOST,
  port: process.env.CUBEJS_DB_PORT,
  user: process.env.CUBEJS_DB_USER,
  password: process.env.CUBEJS_DB_PASS,
  database: process.env.CUBEJS_DB_NAME
}).promise();

exports.query = async (query) => {
  const connection = await pool.getConnection();
  const result = await connection.query(query);
  connection.release()
  return result[0];
};
