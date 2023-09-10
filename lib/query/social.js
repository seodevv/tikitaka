const { getKoreaDate } = require('../common');
const promisePool = require('../db');

const selectSocialRecent = async ({
  limit = 10,
  filter = { user: '', tags: [], follower: '', period: 'recent' },
}) => {
  let where = 'WHERE 1 = 1';
  if (filter.user !== '') {
    where += `
      AND u.nick = "${filter.user}"`;
  }

  if (filter.tags.length !== 0) {
    filter.tags.forEach((tag, i) => {
      where += `
      AND s.tags LIKE "%${tag},%"`;
    });
  }

  if (filter.period !== 'recent') {
    let now = getKoreaDate(new Date());
    let a;
    let b = getKoreaDate(new Date()).toISOString();
    switch (filter.period) {
      case '12h':
        a = new Date(now.setHours(now.getHours() - 12)).toISOString();
        break;
      case '24h':
        a = new Date(now.setHours(now.getHours() - 24)).toISOString();
        break;
      case '7d':
        a = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case '1M':
        a = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
    }
    where += `
      AND modified BETWEEN "${a}" AND "${b}"`;
  }

  let join = '';
  if (filter.follower) {
    join = `
    INNER JOIN (SELECT
                  target
                FROM
                  follower
                WHERE
                  \`source\` = ${filter.follower}) f
      ON f.target = u.id
    `;
  }

  let selectQuery = `
    SELECT 
      s.id,
      u.id as userId,
      u.type as userType,
      u.nick,
      u.profile,
      s.location,
      s.type,
      s.thumbnail,
      s.media,
      s.content,
      s.tags,
      s.created,
      s.modified
    FROM 
      social s 
      INNER JOIN USER u
          ON u.id = s.userId
      ${join}
    ${where}
    ORDER BY 
        s.modified DESC
    LIMIT ${limit}
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialWithOutIds = async ({
  ids,
  modified,
  limit = 10,
  filter = { user: '', tags: [], follower: '' },
}) => {
  let where = '';
  if (filter.user !== '') {
    where += `
      AND u.nick = "${filter.user}"`;
  }

  if (filter.tags.length !== 0) {
    filter.tags.forEach((tag) => {
      where += `
      AND s.tags LIKE "%${tag},%"`;
    });
  }

  let join = '';
  if (filter.follower) {
    join = `
    INNER JOIN (SELECT
                  target
                FROM
                  follower
                WHERE
                  \`source\` = ${filter.follower}) f
      ON f.target = u.id
    `;
  }

  if (filter.period !== 'recent') {
    let standard = new Date(modified);
    let a;
    let b = modified;
    switch (filter.period) {
      case '12h':
        a = new Date(standard.setHours(standard.getHours() - 12)).toISOString();
        break;
      case '24h':
        a = new Date(standard.setHours(standard.getHours() - 24)).toISOString();
        break;
      case '7d':
        a = new Date(standard.setDate(standard.getDate() - 7)).toISOString();
        break;
      case '1M':
        a = new Date(standard.setMonth(standard.getMonth() - 1)).toISOString();
        break;
    }
    where += `
      AND modified BETWEEN "${a}" AND "${b}"`;
  } else {
    where += `
    AND s.modified <= "${modified}"`;
  }

  let selectQuery = `
    SELECT 
      s.id,
      u.id as userId,
      u.type as userType,
      u.nick,
      u.profile,
      s.location,
      s.type,
      s.thumbnail,
      s.media,
      s.content,
      s.tags,
      s.created,
      s.modified
    FROM 
      social s 
      INNER JOIN USER u
          ON u.id = s.userId
      ${join}
    WHERE
      s.id NOT IN (${ids.toString()})
      ${where}
    ORDER BY 
      s.modified DESC
    LIMIT ${limit}
    `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialById = async ({ id }) => {
  let selectQuery = `
  SELECT 
    s.id,
    u.id as userId,
    u.type as userType,
    u.nick,
    u.profile,
    s.location,
    s.type,
    s.thumbnail,
    s.media,
    s.content,
    s.tags,
    s.created,
    s.modified
  FROM 
    social s 
    INNER JOIN USER u
        ON u.id = s.userId
  WHERE
    s.id = ${id}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result[0];
  } catch (error) {
    throw error;
  }
};

const selectSocialByUserId = async ({ userId, limit = 20 }) => {
  let selectQuery = `
  SELECT 
    s.id,
    u.id as userId,
    u.type as userType,
    u.nick,
    u.profile,
    s.location,
    s.type,
    s.thumbnail,
    s.media,
    s.content,
    s.tags,
    s.created,
    s.modified
  FROM 
    social s 
    INNER JOIN USER u
        ON u.id = s.userId
  WHERE
    u.id = ${userId}
  ORDER BY 
    s.modified DESC
  LIMIT
    ${limit}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialWithOutIdsByUserId = async ({
  ids,
  modified,
  userId,
  limit = 20,
}) => {
  let selectQuery = `
  SELECT 
    s.id,
    u.id as userId,
    u.type as userType,
    u.nick,
    u.profile,
    s.location,
    s.type,
    s.thumbnail,
    s.media,
    s.content,
    s.tags,
    s.created,
    s.modified
  FROM 
    social s 
    INNER JOIN USER u
        ON u.id = s.userId
  WHERE
    u.id = ${userId}
    AND s.id NOT IN (${ids.toString()})
    AND s.modified <= "${modified}"
  ORDER BY 
    s.modified DESC
  LIMIT
    ${limit}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialByBookmark = async ({ userId, limit = 20 }) => {
  let selectQuery = `
  SELECT 
    s.id,
    u.id AS userId,
    u.type AS userType,
    u.nick,
    u.profile,
    s.location,
    s.type,
    s.thumbnail,
    s.media,
    s.content,
    s.tags,
    s.created,
    s.modified
  FROM 
    social s 
    INNER JOIN USER u
        ON u.id = s.userId
    INNER JOIN (SELECT 
                  socialId, 
                  bookmark 
                FROM 
                  reaction 
                WHERE 
                  userId = ${userId}
                  AND bookmark IS TRUE) r
	ON r.socialId = s.id
  ORDER BY 
    s.modified DESC
  LIMIT
    ${limit};
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialWidthOutIdsByBookmark = async ({
  ids,
  modified,
  userId,
  limit = 20,
}) => {
  let selectQuery = `
  SELECT 
    s.id,
    u.id AS userId,
    u.type AS userType,
    u.nick,
    u.profile,
    s.location,
    s.type,
    s.thumbnail,
    s.media,
    s.content,
    s.tags,
    s.created,
    s.modified
  FROM 
    social s 
    INNER JOIN USER u
        ON u.id = s.userId
    INNER JOIN (SELECT 
                  socialId, 
                  bookmark 
                FROM 
                  reaction 
                WHERE 
                  userId = ${userId}
                  AND bookmark IS TRUE) r
	ON r.socialId = s.id
  WHERE
    s.id NOT IN (${ids.toString()})
    AND s.modified <= "${modified}"
  ORDER BY 
    s.modified DESC
  LIMIT
    ${limit};
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSocialCountByUserId = async ({ id }) => {
  let selectQuery = `
  SELECT 
    COUNT(*) AS count
  FROM
    social
  WHERE
    userId = "${id}";
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const insertSocial = async ({
  userId,
  location,
  type,
  thumbnail,
  media,
  content,
  tags,
}) => {
  let insertQuery = `
  INSERT INTO social
    (
    userId,
    location,
    \`type\`,
    thumbnail,
    media,
    content,
    tags
    )
  VALUES
    (
    "${userId}",
    "${location}",
    "${type}",
    ${thumbnail ? `"${thumbnail}"` : null},
    "${media}",
    "${content}",
    "${tags}"
    )
	`;
  try {
    const [result] = await promisePool.query(insertQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateSocial = async ({ socialId, content, tags }) => {
  const modified = getKoreaDate(new Date()).toISOString();
  let updateQuery = `
  UPDATE
    social
  SET
    content = "${content}",
    tags = "${tags}",
    modified = CURRENT_TIMESTAMP()
  WHERE
    id = ${socialId}
  `;
  try {
    await promisePool.query(updateQuery);
    return true;
  } catch (error) {
    throw error;
  }
};

const deleteSocial = async ({ id }) => {
  let deleteQuery = `
  DELETE FROM
    social
  WHERE
    id = ${id}
  `;
  try {
    await promisePool.query(deleteQuery);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectSocialRecent,
  selectSocialWithOutIds,
  selectSocialById,
  selectSocialByUserId,
  selectSocialWithOutIdsByUserId,
  selectSocialByBookmark,
  selectSocialWidthOutIdsByBookmark,
  selectSocialCountByUserId,
  insertSocial,
  updateSocial,
  deleteSocial,
};
