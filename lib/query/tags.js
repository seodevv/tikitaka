const promisePool = require('../db');

const selectSearchTags = async ({ searchTag }) => {
  let selectQuery = `
    SELECT
        tag,
        COUNT(tag) AS count
    FROM
        tags
    WHERE
        tag LIKE '${searchTag}%'
    GROUP BY tag
    ORDER BY count DESC`;

  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectTagsSearchTag = async ({ tag }) => {
  let selectQuery = `
  SELECT
    tag
  FROM
    tags
  WHERE
    tag LIKE "${tag}%"
  GROUP BY
    tag;
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const insertTag = async ({ socialId, tags }) => {
  const arr = [...new Set(tags.split(','))];
  arr.splice(arr.length - 1, 1);
  let insertQuery = `
  INSERT INTO 
    tags(socialId, tag)
  VALUES
  `;

  arr.forEach((tag, i) => {
    if (tag === '') return;
    insertQuery += `
      (${socialId}, "${tag}")
    `;
    if (arr.length - 1 !== i) {
      insertQuery += ',';
    }
  });
  try {
    const [result] = await promisePool.query(insertQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteTagById = async ({ socialId }) => {
  let deleteQuery = `
  DELETE FROM
    tags
  WHERE
    socialId = ${socialId}
  `;
  try {
    await promisePool.query(deleteQuery);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectSearchTags,
  selectTagsSearchTag,
  insertTag,
  deleteTagById,
};
