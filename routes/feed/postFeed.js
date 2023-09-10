const logger = require('../../lib/logger');
const { insertAlarm } = require('../../lib/query/alarm');
const {
  selectisFollower,
  insertFollow,
  updateFollowToggle,
} = require('../../lib/query/followers');
const {
  selectSocialWithOutIdsByUserId,
  selectSocialWidthOutIdsByBookmark,
} = require('../../lib/query/social');
const {
  updateUserDesc,
  selectSearchUsersWithPostFollowers,
} = require('../../lib/query/user');

const router = require('express').Router();

router.post('/userInfo/edit', async (req, res) => {
  const { userId, desc } = req.body;
  if (!userId || !desc) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const result = await updateUserDesc({ userId, desc });
    setTimeout(() => {
      return res.json({ success: true, result });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.post('/social/more', async (req, res) => {
  const { ids, modified, userId, limit, filter } = req.body;
  if (!ids || !modified || !userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  let select;
  try {
    if (filter === 'feed') {
      select = await selectSocialWithOutIdsByUserId({
        ids,
        modified,
        userId,
        limit,
      });
    } else if (filter === 'bookmark') {
      select = await selectSocialWidthOutIdsByBookmark({
        ids,
        modified,
        userId,
        limit,
      });
    } else {
      return res.status(400).json({ success: false, message: 'bad request' });
    }
    setTimeout(() => {
      return res.json({
        list: select,
        last: select.length === (limit || 20) ? false : true,
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

router.post('/follow/toggle', async (req, res) => {
  const { userId, target } = req.body;
  if (!userId || !target) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const exist = await selectisFollower({ source: userId, target });
    if (exist) {
      await updateFollowToggle({ source: userId, target });
      return res.json({ success: true, result: 'unfollow' });
    }
    await insertFollow({ source: userId, target });
    await insertAlarm({ source: userId, target, type: 'follow' });
    setTimeout(() => {
      return res.json({ success: true, result: 'follow' });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.post('/searchUser', async (req, res) => {
  const { searchWord } = req.body;
  if (!searchWord) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }
  try {
    const select = await selectSearchUsersWithPostFollowers({ searchWord });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    clogger.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'server error', error });
  }
});

module.exports = router;
