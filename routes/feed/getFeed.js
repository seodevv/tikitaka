const logger = require('../../lib/logger');
const {
  selectFollowerCount,
  selectFollowers,
  selectFollowings,
  selectisFollower,
} = require('../../lib/query/followers');
const {
  selectSocialCountByUserId,
  selectSocialByUserId,
  selectSocialByBookmark,
} = require('../../lib/query/social');
const { selectUserById } = require('../../lib/query/user');
const router = require('express').Router();

router.get('/userInfo', async (req, res) => {
  const { userId } = req.query;
  try {
    const [select] = await selectUserById({ id: userId });
    if (!select) {
      return res.status(400).json({
        success: false,
        message: 'user not found',
      });
    }
    setTimeout(() => {
      return res.json({
        success: true,
        id: select.id,
        type: select.type,
        nick: select.nick,
        email: select.email,
        profile: select.profile,
        desc: select.desc,
        birth: select.birth,
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/count', async (req, res) => {
  const { userId } = req.query;
  try {
    const [social] = await selectSocialCountByUserId({ id: userId });
    const { follower, following } = await selectFollowerCount({ id: userId });
    setTimeout(() => {
      return res.json({
        id: userId,
        posts: social.count,
        followers: follower.count,
        followings: following.count,
      });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/isFollow', async (req, res) => {
  const { userId, target } = req.query;
  if (!userId || !target) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const isFollow = await selectisFollower({ source: userId, target });
    if (isFollow && isFollow.status) {
      return res.json({ success: true, result: true });
    }
    setTimeout(() => {
      return res.json({ success: true, result: false });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.get('/social', async (req, res) => {
  const { userId, limit, filter } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  let select;
  try {
    if (filter === 'feed') {
      select = await selectSocialByUserId({ userId, limit });
    } else if (filter === 'bookmark') {
      select = await selectSocialByBookmark({ userId, limit });
    } else {
      return res.status(400).json({ success: false, message: 'bad request' });
    }

    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.get('/followers', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const result = await selectFollowers({ id: userId });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

router.get('/followings', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const result = await selectFollowings({ id: userId });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

module.exports = router;
