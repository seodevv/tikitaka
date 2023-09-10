const { getKoreaDate } = require('../common');
const promisePool = require('../db');

const selectChat = async ({ creator, target }) => {
  let queryString = 'SELECT * FROM chat ';

  if (creator && target) {
    queryString += `WHERE creator = ${creator} AND target = ${target} `;
  }
  try {
    const [rows] = await promisePool.query(queryString);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectChatList = async ({ creator, chatId }) => {
  let queryString = `
  SELECT 
    c.id,
    c.target AS userId,
    u.type as userType,
    u.userId AS userName,
    u.nick,
    u.profile,
    c.pined,
    c.lastChatId AS messageId,
    cm.date AS messageDate,
    cm.type AS messageType,
    cm.message,
    cm.userId as messageUserId,
    c.modified
  FROM chat c
  INNER JOIN user u 
    ON c.target = u.id
  LEFT OUTER JOIN chat_message cm
    ON c.lastChatId = cm.id
  WHERE 
    c.creator = ${creator}
    AND c.status = "active"
    ${chatId ? `AND c.id = "${chatId}"` : ''}
  ORDER BY
    c.modified DESC,
    cm.date DESC`;
  try {
    const [rows] = await promisePool.query(queryString);
    const result = rows.map((row) => ({
      ...row,
      messageDate: getKoreaDate(row.messageDate),
      modified: getKoreaDate(row.modified),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectChatMessage = async ({ id, chatId, limit }) => {
  let queryString = `
  SELECT 
    cm.id,
    cm.chatId,
    cm.userId,
    u.type as userType,
    u.userId AS userName,
    u.email,
    u.nick,
    u.profile,
    u.birth,
    u.regist,
    cm.type,
    cm.message,
    cm.date
  FROM chat_message cm
  INNER JOIN user u
    ON u.id = cm.userId
  WHERE 
    cm.chatId = "${chatId}"
    ${id ? `AND cm.id < ${id}` : ''}
  ORDER BY
  cm.date desc,
  cm.id desc
  LIMIT ${limit};`;
  try {
    const [rows] = await promisePool.query(queryString);
    const result = rows.reverse().map((row) => ({
      ...row,
      date: getKoreaDate(row.date),
      birth: getKoreaDate(row.birth),
      regist: getKoreaDate(row.regist),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectChatMessageById = async ({ id }) => {
  let queryString = `
  SELECT
    cm.id,
    cm.chatId,
    cm.userId,
    u.type as userType,
    u.userId AS userName,
    u.email,
    u.nick,
    u.profile,
    u.birth,
    u.regist,
    cm.type,
    cm.message,
    cm.date
  FROM
    chat_message cm
  INNER JOIN user u
    ON u.id = cm.userId
  WHERE
    cm.id = "${id}"`;
  try {
    const [rows] = await promisePool.query(queryString);
    const result = rows.map((row) => ({
      ...row,
      date: getKoreaDate(row.date),
      birth: getKoreaDate(row.birth),
      regist: getKoreaDate(row.regist),
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectUnreadCount = async ({ chatId, creator }) => {
  let queryString = `
  SELECT 
    COUNT(*) AS count
  FROM chat_message 
  WHERE 
    chatId = '${chatId}' 
    AND userId <> ${creator} 
    AND isRead = FALSE;`;
  try {
    const [count] = await promisePool.query(queryString);
    return count;
  } catch (error) {
    throw error;
  }
};

const insertChat = async ({ id, creator, target }) => {
  let queryString_1 = `
  SELECT
    id
  FROM 
    chat
  WHERE
    target = "${creator}"
    AND creator = "${target}"`;

  try {
    const [exist] = await promisePool.query(queryString_1);
    if (exist.length !== 0) {
      let queryString_2 = `
        INSERT INTO 
        chat(id, creator, target) 
      VALUES 
        ("${exist[0].id}", "${creator}", "${target}")
      `;
      await promisePool.query(queryString_2);
      return exist[0];
    } else {
      let queryString_2 = `
        INSERT INTO 
        chat(id, creator, target) 
      VALUES 
        ("${id}", "${creator}", "${target}"),
        ("${id}", "${target}", "${creator}")
      `;
      await promisePool.query(queryString_2);
      return false;
    }
  } catch (error) {
    throw error;
  }
};

const insertChatMessage = async ({ chatId, creator, message, type }) => {
  let insertQuery = `
  INSERT INTO 
    chat_message(chatId, userId, message, \`type\`) 
  VALUES 
    ( ?,
      ?,
      ?,
      ?)`;
  try {
    const [result] = await promisePool.query(insertQuery, [
      chatId,
      creator,
      message,
      type,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const insertChatMessageImage = async ({ chatId, creator, filename }) => {
  let queryString = `
  INSERT INTO
    chat_message(chatId, userId, type, message)
  values
    ("${chatId}", "${creator}", "image", "${filename}")
  `;
  try {
    const [result] = await promisePool.query(queryString);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateChatDate = async ({ chatId, creator }) => {
  let queryString = `
  UPDATE 
    chat
  SET 
    modified = now()
  WHERE
    id = '${chatId} '
    ${creator ? `AND creator = "${creator}"` : ''}`;

  try {
    await promisePool.query(queryString);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateChatPined = async ({ chatId, creator }) => {
  let queryString = `
  UPDATE
    chat c
  SET
    pined = c.pined IS FALSE
  WHERE
    id = "${chatId}"
    AND creator = "${creator}";
  `;
  try {
    await promisePool.query(queryString);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateChatlastChatId = async ({ chatId, lastChatId }) => {
  let queryString = `
  UPDATE
    chat
  SET
    lastChatId = "${lastChatId}",
    modified = NOW()
  WHERE
    id = "${chatId}"`;
  try {
    const [result] = await promisePool.query(queryString);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateChatMessageUnread = async ({ chatId, creator }) => {
  let queryString = `
  UPDATE
    chat_message
  SET
    isRead = TRUE
  WHERE
    chatId = "${chatId}"
    AND userId <> "${creator}"`;
  try {
    await promisePool.query(queryString);
    return true;
  } catch (error) {
    throw error;
  }
};

const disableChat = async ({ chatId, creator }) => {
  let updateQuqery = `
  UPDATE
    chat
  SET
    STATUS = 'disable'
  WHERE
    id = "${chatId}"
    AND creator = "${creator}"
  `;
  try {
    const [result] = await promisePool.query(updateQuqery);
    return result;
  } catch (error) {
    throw error;
  }
};

const selectChatStatus = async ({ id, creator }) => {
  let selectQuery = `
  SELECT
    id,
    creator,
    target,
    status
  FROM
    chat
  WHERE
    id = "${id}"
    ${creator ? `AND creator = ${creator}` : ''}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const updateChatStatusActive = async ({ id, creator }) => {
  let updateQuery = `
  UPDATE
    chat
  SET
    status = 'active'
  WHERE
    id = "${id}"
    ${creator ? `AND creator = "${creator}"` : ''}
  `;
  try {
    await promisePool.query(updateQuery);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectChat,
  selectChatList,
  selectChatMessage,
  selectChatMessageById,
  selectUnreadCount,
  insertChat,
  insertChatMessage,
  insertChatMessageImage,
  updateChatDate,
  updateChatPined,
  updateChatlastChatId,
  updateChatMessageUnread,
  disableChat,
  selectChatStatus,
  updateChatStatusActive,
};
