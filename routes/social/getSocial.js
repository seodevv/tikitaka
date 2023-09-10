const logger = require('../../lib/logger');
const { selectEmojis, selectEmojisType } = require('../../lib/query/emojis');
const {
  selectReactionById,
  selectReactionCount,
} = require('../../lib/query/reaction');
const {
  selectCommentById,
  deleteComment,
  selectCommentCount,
} = require('../../lib/query/reply');
const {
  selectSocialRecent,
  selectSocialById,
} = require('../../lib/query/social');
const router = require('express').Router();

router.get('/article', async (req, res) => {
  const { socialId } = req.query;
  if (!socialId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const select = await selectSocialById({ id: socialId });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

router.get('/article/recent', async (req, res) => {
  const { limit } = req.query;
  const filter = JSON.parse(req.query.filter);
  try {
    const select = await selectSocialRecent({ limit, filter });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/reaction', async (req, res) => {
  const { socialId, userId } = req.query;
  if (!socialId || !userId) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const [result] = await selectReactionById({ socialId, userId });
    if (!result) {
      return res.json({ like: false, bookmark: false });
    }
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/reaction/count', async (req, res) => {
  const { socialId } = req.query;
  if (!socialId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const [select] = await selectReactionCount({ socialId });
    if (!select) {
      return res.json({ count: 0 });
    }
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.get('/comment', async (req, res) => {
  const { socialId } = req.query;
  if (!socialId) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const select = await selectCommentById({ socialId });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.post('/comment/delete', async (req, res) => {
  const { id, socialId } = req.body;
  if (!id && !socialId) {
    return res.status(400).json({ error: true, message: 'bad reqest' });
  }

  try {
    await deleteComment({ id, socialId });
    setTimeout(() => {
      return res.json({ deleted: true });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/comment/count', async (req, res) => {
  const { socialId } = req.query;
  if (!socialId) {
    return res.status(400).json({ error: true, message: 'bad reqest' });
  }

  try {
    const [result] = await selectCommentCount({ socialId });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/emojisType', async (req, res) => {
  try {
    const select = await selectEmojisType();
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.get('/emojis', async (req, res) => {
  const { type } = req.query;
  if (!type) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const select = await selectEmojis({ type });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;
