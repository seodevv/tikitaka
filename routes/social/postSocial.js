const { selectEmojisKeyword } = require('../../lib/query/emojis');
const {
  selectReactionById,
  insertReaction,
  toggleReaction,
} = require('../../lib/query/reaction');
const {
  selectCommentById,
  insertComment,
  deleteComment,
} = require('../../lib/query/reply');
const { selectUserSearchNick } = require('../../lib/query/user');
const {
  selectSocialWithOutIds,
  selectSocialById,
  deleteSocial,
  updateSocial,
} = require('../../lib/query/social');
const {
  selectSearchTags,
  selectTagsSearchTag,
  deleteTagById,
  insertTag,
} = require('../../lib/query/tags');
const fs = require('fs');
const {
  insertAlarm,
  selectAlarmByConditions,
} = require('../../lib/query/alarm');
const logger = require('../../lib/logger');
const router = require('express').Router();

router.post('/article/more', async (req, res) => {
  const { ids, modified, limit, filter } = req.body;
  if (!ids || !modified) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const select = await selectSocialWithOutIds({
      ids,
      modified,
      limit,
      filter,
    });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

router.post('/article/edit', async (req, res) => {
  const { socialId, content, tags } = req.body;
  if (!socialId || !content || !tags) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    await updateSocial({ socialId, content, tags: tags + ',' });
    await deleteTagById({ socialId });
    await insertTag({ socialId, tags: tags + ',' });
    setTimeout(() => {
      return res.json({ success: true, result: 'updated' });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, error });
  }
});

router.post('/article/delete', async (req, res) => {
  const { socialId } = req.body;
  if (!socialId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const select = await selectSocialById({ id: socialId });
    switch (select.type) {
      case 'image': {
        const mediaArray = select.media.split('/');
        mediaArray.forEach((filename) => {
          const file = `public/img/social/${select.userId}/${filename}`;
          fs.unlink(file, (error) => {
            if (error) logger.error(error);
            logger.log(file, 'deleted');
          });
        });
        break;
      }
      case 'video': {
        const mediaArray = [select.thumbnail, select.media];
        mediaArray.forEach((filename) => {
          const file = `public/video/social/${select.userId}/${filename}`;
          fs.unlink(file, (error) => {
            if (error) logger.error(error);
            logger.log(file, 'deleted');
          });
        });
        break;
      }
    }
    await deleteSocial({ id: socialId });
    setTimeout(() => {
      return res.json({ success: true, result: 'deleted' });
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: true, error });
  }
});

router.post('/article/search', async (req, res) => {
  const { searchWord } = req.body;
  if (!searchWord) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const user = await selectUserSearchNick({ nick: searchWord });
    const tag = await selectTagsSearchTag({ tag: searchWord });
    setTimeout(() => {
      return res.json({ success: true, user, tag });
    });
  } catch (error) {
    logger.error(erorr);
    return res.status(500).json({ success: false, error });
  }
});

router.post('/reaction/toggle', async (req, res) => {
  const { type, socialId, userId } = req.body;
  if (!socialId || !userId) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const [select] = await selectReactionById({ socialId, userId });
    if (!select) {
      await insertReaction({ type, socialId, userId });
      const result = await selectSocialById({ id: socialId });

      if (type === 'like' && userId !== result.userId) {
        insertAlarm({
          source: userId,
          target: result.userId,
          socialId,
          type: 'like',
        });
      }
      return res.json(result);
    }
    await toggleReaction({ type, socialId, userId });
    const result = await selectSocialById({ id: socialId });

    const [exist] = await selectAlarmByConditions({
      source: userId,
      target: result.userId,
      socialId,
      type: 'like',
    });
    if (type === 'like' && !select.like && !exist && userId !== result.userId) {
      insertAlarm({
        source: userId,
        target: result.userId,
        socialId,
        type: 'like',
      });
    }
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: true, message: 'bad request' });
  }
});

router.post('/comment/add', async (req, res) => {
  const { socialId, creator, target } = req.body;
  let { comment } = req.body;
  if (!socialId || !creator || !target || !comment) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const { insertId } = await insertComment({
      socialId,
      userId: creator,
      reply: comment,
    });
    const [result] = await selectCommentById({ id: insertId });

    if (creator !== target) {
      insertAlarm({ source: creator, target, socialId, type: 'reply' });
    }

    setTimeout(() => {
      return res.json(result);
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

router.post('/tags/search', async (req, res) => {
  const { searchTag } = req.body;
  if (!searchTag) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const select = await selectSearchTags({ searchTag });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.post('/emojis/search', async (req, res) => {
  const { searchWord } = req.body;
  if (!searchWord) {
    return res.status(400).json({ error: true, message: 'bad request' });
  }

  try {
    const select = await selectEmojisKeyword({ searchWord });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;
