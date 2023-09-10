const promisePool = require('../db');

const selectSubscribe = async ({ userId }) => {
  let selectQuery = `
    SELECT
        id,
        userId,
        endpoint,
        expirationTime,
        p256dh,
        auth
    FROM
        subscribe
    WHERE
        userId = ?
    `;
  try {
    const [rows] = await promisePool.query(selectQuery, [userId]);
    return rows;
  } catch (error) {
    throw error;
  }
};

const insertSubscribe = async ({ subscription, userId }) => {
  let insertQuery = `
    INSERT INTO
        subscribe(userId, \`endpoint\`, expirationTime, p256dh, auth)
    VALUES
        (?, ?, ?, ?, ?)
    `;
  try {
    await promisePool.query(insertQuery, [
      userId,
      subscription.endpoint,
      subscription.expirationTime,
      subscription.keys.p256dh,
      subscription.keys.auth,
    ]);
    return true;
  } catch (error) {
    throw error;
  }
};

const deleteSubscribe = async ({ endpoint, userId }) => {
  let insertQuery = `
    DELETE FROM
        subscribe
    WHERE
        endpoint = ?
        AND userId = ?
    `;
  try {
    await promisePool.query(insertQuery, [endpoint, userId]);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = { selectSubscribe, insertSubscribe, deleteSubscribe };
