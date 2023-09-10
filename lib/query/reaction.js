const promisePool = require('../db');

const selectReactionById = async ({ socialId, userId }) => {
  let selectQuery = `
    SELECT
        id,
        socialId,
        userId,
        \`like\`,
        bookmark
    FROM
        reaction
    WHERE
        socialId = ${socialId}
        AND userId = ${userId}
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectReactionCount = async ({ socialId }) => {
  let selectQuery = `
    SELECT
      COUNT(*) AS count
    FROM
      reaction
    WHERE
      socialId = ${socialId}
      AND \`like\` IS TRUE
    GROUP BY socialId
  `;

  try {
    const [count] = await promisePool.query(selectQuery);
    return count;
  } catch (error) {
    throw error;
  }
};

const insertReaction = async ({ type, socialId, userId }) => {
  let insertQuery = `
    INSERT INTO reaction
        (
         socialId, 
         userId, 
         ${type === 'like' ? '`like`' : 'bookmark'}
        ) 
    VALUES 
        (
         ${socialId},
         ${userId},
         TRUE
        );
    `;
  try {
    const [result] = await promisePool.query(insertQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

const toggleReaction = async ({ type, socialId, userId }) => {
  let updateQuery = `
    UPDATE
        reaction r
    SET
      ${
        type === 'like'
          ? '`like` = r.like IS FALSE'
          : 'bookmark = r.bookmark IS FALSE'
      }
    WHERE
        socialId = ${socialId}
        AND userId = ${userId}
  `;
  try {
    const [result] = await promisePool.query(updateQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectReactionById,
  selectReactionCount,
  insertReaction,
  toggleReaction,
};
