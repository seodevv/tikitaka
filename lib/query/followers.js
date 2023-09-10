const promisePool = require('../db');

const selectFollowerCount = async ({ id }) => {
  let selectFollower = `
    SELECT
        COUNT(*) AS count
    FROM
        follower f
    WHERE
        f.target = ?
        AND f.status IS TRUE
    `;
  let selectFollowing = `
    SELECT
        COUNT(*) AS count
    FROM
        follower f
    WHERE
        f.source = ?
        AND f.status IS TRUE
    `;
  try {
    const [[follower]] = await promisePool.query(selectFollower, [id]);
    const [[following]] = await promisePool.query(selectFollowing, [id]);
    return {
      follower,
      following,
    };
  } catch (error) {
    throw error;
  }
};

const selectisFollower = async ({ source, target }) => {
  let selectQuery = `
  SELECT
    status
  FROM
    follower f
  WHERE
    f.source = ?
    AND f.target = ?
  `;
  try {
    const [rows] = await promisePool.query(selectQuery, [source, target]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

const selectFollowers = async ({ id }) => {
  let selectQuery = `
  SELECT 
    u.id,
    u.type,
    u.nick,
    u.profile
  FROM 
    follower f
  INNER JOIN USER u
    ON u.id = f.source
  WHERE
    f.target = ?
    AND f.status IS TRUE;
  `;
  try {
    const [rows] = await promisePool.query(selectQuery, [id]);
    return rows;
  } catch (error) {
    throw error;
  }
};

const selectFollowings = async ({ id }) => {
  let selectQuery = `
  SELECT 
    u.id,
    u.type,
    u.nick,
    u.profile
  FROM 
    follower f
  INNER JOIN USER u
    ON u.id = f.target
  WHERE
    f.source = ?
    AND f.status IS TRUE;
  `;
  try {
    const [rows] = await promisePool.query(selectQuery, [id]);
    return rows;
  } catch (error) {
    throw error;
  }
};

const insertFollow = async ({ source, target }) => {
  let insertQuery = `
  INSERT INTO
    follower(source, target)
  VALUES
    (?, ?)
  `;
  try {
    await promisePool.query(insertQuery, [source, target]);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateFollowToggle = async ({ source, target }) => {
  let updateQuery = `
  UPDATE
    follower f
  SET
    f.status = f.status IS FALSE
  WHERE
    f.source = ?
    AND f.target = ?
  `;
  try {
    await promisePool.query(updateQuery, [source, target]);
    return true;
  } catch (error) {
    throw error;
  }
};

// const deleteFollow = async ({ source, target }) => {
//   let deleteQuery = `
//   DELETE FROM
//     follower
//   WHERE
//     \`source\` = ${source}
//     AND target = ${target}
//   `;
//   try {
//     await promisePool.query(deleteQuery);
//     return true;
//   } catch (error) {
//     throw error;
//   }
// };

module.exports = {
  selectFollowerCount,
  selectisFollower,
  selectFollowers,
  selectFollowings,
  insertFollow,
  updateFollowToggle,
  // deleteFollow,
};
