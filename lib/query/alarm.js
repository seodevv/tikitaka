const promisePool = require('../db');
const { getKoreaDate, pushNotification } = require('../common');

const selectAlarmByConditions = async ({
  id,
  source,
  target,
  soclaiId,
  chatId,
  type,
}) => {
  let selectQuery = `
  SELECT
    a.id,
    a.source,
    u.type AS sourceType,
    u.nick AS sourceNick,
    u.profile AS sourceProfile,
    a.target,
    a.type,
    a.chatId,
    a.socialId,
    s.type AS socialType,
    s.thumbnail AS socialThumbnail,
    s.media AS socialMedia,
    a.created,
    a.isRead
  FROM
    alarm a
    INNER JOIN user u
      ON u.id = a.source
    LEFT OUTER JOIN social s
      ON s.id = a.socialId
  WHERE
    1 = 1
  `;
  if (id) {
    selectQuery += `
    AND a.id = ${id}`;
  }
  if (source) {
    selectQuery += `
    AND a.source = ${source}`;
  }
  if (target) {
    selectQuery += `
    AND a.target = ${target}`;
  }

  if (type) {
    selectQuery += `
    AND a.type = "${type}"`;
  }

  if (soclaiId) {
    selectQuery += `
    AND a.socialId = ${socialId}`;
  }
  if (chatId) {
    selectQuery += `
    AND chatId = ${chatId}`;
  }
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

const selectAlarmByTarget = async ({ target }) => {
  let selectQuery = `
  SELECT
    a.id,
    a.source,
    u.type AS sourceType,
    u.nick AS sourceNick,
    u.profile AS sourceProfile,
    a.target,
    a.type,
    a.chatId,
    a.socialId,
    s.type AS socialType,
    s.thumbnail AS socialThumbnail,
    s.media AS socialMedia,
    a.created,
    a.isRead
  FROM
    alarm a
    INNER JOIN user u
      ON u.id = a.source
    LEFT OUTER JOIN social s
      ON s.id = a.socialId
  WHERE
    a.target = ?
  ORDER BY
    a.created DESC
  `;
  try {
    const [rows] = await promisePool.query(selectQuery, [target]);
    const result = rows.map((row) => ({
      ...row,
      created: getKoreaDate(row.created),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectAlarmCount = async ({ target }) => {
  let selectQuery = `
  SELECT
    COUNT(id) as count
  FROM
    alarm
  WHERE
    isRead IS FALSE
    AND target = ?
  `;
  try {
    const [rows] = await promisePool.query(selectQuery, [target]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

const insertAlarm = async ({
  source,
  target,
  chatId = null,
  socialId = null,
  type,
}) => {
  let insertQuery = `
    INSERT INTO
        alarm(\`source\`, target, chatId, socialId, \`type\`)
    VALUES
        (?, ?, ?, ?, ?)
    `;
  try {
    const [{ insertId }] = await promisePool.query(insertQuery, [
      source,
      target,
      chatId,
      socialId,
      type,
    ]);
    const [data] = await selectAlarmByConditions({ id: insertId });
    pushNotification({ data });

    return true;
  } catch (error) {
    throw error;
  }
};

const updateAlarmIsRead = async ({ target }) => {
  let updateQuery = `
  UPDATE
    alarm
  SET
    isRead = TRUE
  WHERE
    target = ?
  `;
  try {
    await promisePool.query(updateQuery, [target]);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectAlarmByConditions,
  selectAlarmByTarget,
  selectAlarmCount,
  insertAlarm,
  updateAlarmIsRead,
};
