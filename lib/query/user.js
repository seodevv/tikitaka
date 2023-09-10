const promisePool = require('../db');
const { getKoreaDate } = require('../common');

const selectAllUsers = async () => {
  let queryString = 'SELECT * FROM user ';
  try {
    const [rows] = await promisePool.query(queryString);
    const result = rows.map((row) => ({
      ...row,
      birth: getKoreaDate(row.birth),
      regist: getKoreaDate(row.regist),
      login: row.login ? getKoreaDate(row.login) : null,
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectUser = async ({ type = 'App', id, userId }) => {
  let selectQuery = `SELECT
    id,
    type,
    userId,
    email,
    password,
    nick,
    birth,
    profile,
    regist,
    login
  FROM user
  WHERE
    \`type\` = "${type}"
    ${id ? `AND id = "${id}"` : ''}
    ${userId ? `AND userId = "${userId}"` : ''}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      birth: getKoreaDate(row.birth),
      regist: getKoreaDate(row.regist),
      login: row.login ? getKoreaDate(row.login) : null,
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const selectSearchUsers = async ({ searchId, id }) => {
  let queryString = `
  SELECT 
    id,
    type as userType,
    userId,
    nick,
    profile
  FROM user
  WHERE nick like "%${searchId}%"
    AND userId <> "admin" 
    AND id <> ${id}
  `;

  try {
    const [rows] = await promisePool.query(queryString);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectSearchUsersWithPostFollowers = async ({ searchWord }) => {
  let selectQuery = `
  SELECT
    u.id,
    u.type,
    u.nick,
    u.profile,
    COUNT(s.id) AS posts,
    f.count AS followers
  FROM
    user u
    LEFT OUTER JOIN social s
      ON u.id = s.userId
    INNER JOIN (SELECT
                  u.id,
                  u.nick,
                  COUNT(f.target) AS COUNT
                FROM
                  user u
                LEFT OUTER JOIN follower f
                  ON u.id = f.target
                GROUP BY u.id) f
      ON f.id = u.id
  WHERE
    u.nick LIKE '${searchWord}%'
  GROUP BY u.id
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectPasswordUser = async ({ userId }) => {
  let queryString = `
  SELECT 
    password 
  FROM 
    user 
  WHERE 
    userId = "${userId}"`;
  try {
    const [rows] = await promisePool.query(queryString);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectUserByNick = async ({ nick }) => {
  let selectQuery = `
  SELECT
    id
  FROM
    user
  WHERE
    nick = "${nick}"
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectUserSearchNick = async ({ nick }) => {
  let selectQuery = `
  SELECT
    id,
    type,
    userId,
    nick,
    profile
  FROM
    user
  WHERE
    nick LIKE "%${nick}%"
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectUserById = async ({ id }) => {
  let selectQuery = `
  SELECT
    id,
    type,
    userId,
    email,
    password,
    nick,
    birth,
    profile,
    \`desc\`,
    regist,
    login
  FROM 
    user
  WHERE
    id = ${id}
  `;
  try {
    const [rows] = await promisePool.query(selectQuery);
    const result = rows.map((row) => ({
      ...row,
      birth: getKoreaDate(row.birth),
      regist: getKoreaDate(row.regist),
      login: row.login ? getKoreaDate(row.login) : null,
    }));
    return result;
  } catch (error) {
    throw error;
  }
};

const insertUser = async ({ userId, password, nick }) => {
  let queryString = `
  INSERT INTO
    USER(userId, \`password\`, email, nick) 
  VALUES
    ("${userId}", "${password}", "${userId}", "${nick}")`;
  try {
    const [result] = await promisePool.query(queryString);
    return result;
  } catch (error) {
    throw error;
  }
};

const insertOauthUser = async ({ type, id, email, name, picture }) => {
  let insertQuery = `
  INSERT INTO 
    \`user\`
      (\`type\`, userId, email, nick, \`profile\`) 
    VALUES
      ("${type}", 
        "${id}", 
        ${email ? `"${email}"` : null}, 
        "${name}", 
        "${picture}")
  `;
  try {
    const [result] = await promisePool.query(insertQuery);
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

const updateLoginUser = async ({ id, login }) => {
  let queryString = `
  UPDATE
      USER
  SET
    ${login ? 'login = NOW()' : 'login = null'}
  WHERE
    id = "${id}";`;
  try {
    const [result] = await promisePool.query(queryString);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateLoginSetNull = async () => {
  let queryString = `UPDATE
    user
  SET
    login = NULL
  WHERE
    login IS NOT NULL`;
  try {
    const [result] = await promisePool.query(queryString);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateUserProfile = async ({ id, email, nick, birth, profile }) => {
  const updateQuery = `
  UPDATE
    user
  SET
    ${id ? `id = "${id}"` : ''}
    ${email ? `,email = "${email}"` : ''} 
    ${nick ? `,nick = "${nick}"` : ''} 
    ${birth ? `,birth = "${birth}"` : ''} 
    ${profile ? `,profile = "${profile}"` : ''} 
  WHERE
    id = "${id}"
  `;
  try {
    const [result] = await promisePool.query(updateQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateUserDesc = async ({ userId, desc }) => {
  let updateQuery = `
  UPDATE
    user
  SET
    \`desc\` = "${desc}"
  WHERE
    id = ${userId}
  `;
  try {
    const [result] = await promisePool.query(updateQuery);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  selectAllUsers,
  selectUser,
  selectSearchUsers,
  selectSearchUsersWithPostFollowers,
  selectPasswordUser,
  selectUserByNick,
  selectUserSearchNick,
  selectUserById,
  insertUser,
  insertOauthUser,
  updateLoginUser,
  updateLoginSetNull,
  updateUserProfile,
  updateUserDesc,
};
