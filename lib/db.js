const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.TIKITAKA_DB_HOST,
  port: process.env.TIKITAKA_DB_PORT,
  database: process.env.TIKITAKA_DB_INSTANCE,
  user: process.env.TIKITAKA_DB_USER,
  password: process.env.TIKITAKA_DB_PASSWORD,
  connectionLimit: 50,
});

const promisePool = pool.promise();

module.exports = promisePool;
