const promisePool = require('../db');

const selectAllMenus = async () => {
  let queryString = 'SELECT * FROM menu';
  try {
    const [rows] = await promisePool.query(queryString);
    return rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectAllMenus,
};
