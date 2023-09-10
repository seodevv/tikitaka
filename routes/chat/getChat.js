const {
  selectChatList,
  selectChatMessage,
  selectUnreadCount,
} = require('../../lib/query/chat');

const router = require('express').Router();

router.get('/', async (req, res) => {
  const { creator, chatId } = req.query;
  if (!creator || !chatId) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const [result] = await selectChatList({ creator, chatId });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.get('/list', async (req, res) => {
  const { creator } = req.query;
  if (!creator) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const result = await selectChatList({ creator });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.get('/message', async (req, res) => {
  let { chatId, limit } = req.query;
  if (!chatId || !limit) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const result = await selectChatMessage({ chatId, limit });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.get('/unReadCount', async (req, res) => {
  const { chatId, creator } = req.query;
  if (!chatId || !creator) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const [result] = await selectUnreadCount({ chatId, creator });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../lib/logger');
router.get('/opengraph', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const html = await axios.get(url);
    const $ = cheerio.load(html.data);
    const $metas = $('head').children('meta');
    const data = {};
    $metas.each(function (i, el) {
      const property = $(this).attr('property');
      if (!property) return;
      if (!/^og/.test(property)) return;

      const content = $(this).attr('content');
      data[property.substring(3)] = content;
    });
    setTimeout(() => {
      return res.json({ success: true, opengraph: data });
    });
  } catch (error) {
    // logger.error(error);
    return res.status(500).json({ success: false, message: 'invalid url' });
  }
});

module.exports = router;
