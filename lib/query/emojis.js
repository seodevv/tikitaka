const promisePool = require('../db');

const selectEmojisType = async () => {
  let selectQuery = `
    SELECT
      \`index\`,
      iconType,
      icon,
      \`type\`
    FROM
      emojis_type
    ORDER BY
      \`index\`
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectEmojis = async ({ type }) => {
  let selectQuery = `
    SELECT
      id,
      \`type\`,
      \`unicode\`,
      \`desc\`
    FROM
      emojis
    ${type ? `WHERE \`type\` = "${type}"` : ''}
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectEmojisKeyword = async ({ searchWord }) => {
  let selectQuery = `
  SELECT
    id,
    \`type\`,
    \`unicode\`,
    \`desc\`
  FROM
    emojis
  WHERE
    \`type\` LIKE "${searchWord}%"
    OR \`desc\` LIKE "${searchWord}%"
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

module.exports = { selectEmojisType, selectEmojis, selectEmojisKeyword };
