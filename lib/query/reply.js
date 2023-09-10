const { getKoreaDate } = require('../common');
const promisePool = require('../db');

const selectCommentById = async ({ id, socialId }) => {
  let selectQuery = `
    SELECT
        r.id,
        r.socialId,
        u.id as userId,
        u.type,
        u.nick,
        u.profile,
        r.reply,
        r.likes,
        r.created
    FROM
        reply r
    INNER JOIN \`user\` u 
        ON u.id = r.userid
    WHERE
        ${id ? `r.id = ${id}` : ''}
        ${socialId ? `r.socialId = ${socialId}` : ''}
    ORDER BY    
        r.created,
        r.id
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectCommentCount = async ({ socialId }) => {
  let selectQuery = `
    SELECT
      COUNT(*) as count
    FROM
      reply
    WHERE
      socialId = ${socialId}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const insertComment = async ({ socialId, userId, reply }) => {
  let insertQuery = `
    INSERT INTO reply
        (socialId, userId, reply)
    VALUES
        (?, ?, ?)
    `;
  try {
    const [result] = await promisePool.query(insertQuery, [
      socialId,
      userId,
      reply,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteComment = async ({ id, socialId }) => {
  let deleteQuery = `
    DELETE FROM reply WHERE id = ${id} AND socialId = ${socialId};
  `;
  try {
    await promisePool.query(deleteQuery);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectCommentById,
  selectCommentCount,
  insertComment,
  deleteComment,
};
