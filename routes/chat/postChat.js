const {
  selectChat,
  insertChat,
  updateChatDate,
  updateChatPined,
  insertChatMessage,
  selectChatMessageById,
  updateChatMessageUnread,
  updateChatlastChatId,
  selectChatMessage,
  disableChat,
  updateChatStatusActive,
  selectChatStatus,
} = require('../../lib/query/chat');
const { getKoreaDate } = require('../../lib/common');
const { insertAlarm } = require('../../lib/query/alarm');
const logger = require('../../lib/logger');

const router = require('express').Router();

router.post('/add', async (req, res) => {
  const { id, creator, target } = req.body;

  if (!id || !creator || !target) {
    res.status(400).send({ error: true, message: 'bad request' });
    return;
  }

  try {
    const exist = await selectChat({ creator, target });
    if (exist.length !== 0) {
      await updateChatStatusActive({ id: exist[0].id, creator });
      setTimeout(() => {
        res.json({ exist: true, id: exist[0].id });
      });
      return;
    }

    const result = await insertChat({ id, creator, target });
    if (result) {
      res.json({ exist: false, id: result.id });
      return;
    }
    setTimeout(() => {
      return res.json({ exist: false, id });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/message', async (req, res) => {
  let { id, chatId, limit } = req.body;
  if (!id || !chatId || !limit) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const result = await selectChatMessage({ id, chatId, limit });
    setTimeout(() => {
      return res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/date/update', async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const result = await updateChatDate({ chatId });
    setTimeout(() => {
      return res.json({ updated: result });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/pined/update', async (req, res) => {
  const { chatId, creator } = req.body;
  const date = getKoreaDate().toISOString();
  if (!chatId || !creator) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    await updateChatDate({ chatId, creator, date });
    await updateChatPined({ chatId, creator });
    setTimeout(() => {
      return res.json({ updated: true });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/unRead/update', async (req, res) => {
  const { chatId, creator } = req.body;
  if (!chatId || !creator) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const result = await updateChatMessageUnread({ chatId, creator });
    setTimeout(() => {
      return res.json({ updated: result });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

router.post('/message/add', async (req, res) => {
  const { chatId, creator } = req.body;
  let { message } = req.body;

  if (!chatId || !creator || !message) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  const href_regex =
    /(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%._\+~#=]{2,256})(\.[a-z]{2,6})\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  let type = 'text';
  if (href_regex.test(message)) {
    const tld = message.match(href_regex)[4];
    const tldList = [
      '.com',
      '.org',
      '.net',
      '.info',
      '.biz',
      '.wiki',
      '.edu',
      '.gov',
      '.cat',
      '.museum',
      '.travel',
      '.io',
      '.kr',
      '.us',
      '.uk',
      '.es',
      '.jp',
      '.cn',
    ];
    type = tldList.includes(tld) ? 'href' : type;
  }

  const youtube_regex =
    /(?:http:|https:)?(?:\/\/)?(?:www\.)?(?:youtube.com|youtu.be)\/(?:watch|embed)?(?:\?v=|\/)?(\S+)?/;
  type =
    youtube_regex.test(message) && message.match(youtube_regex)[1]
      ? 'youtube'
      : type;

  try {
    const exist = await selectChatStatus({ id: chatId });
    const hasDisabled = exist.some((v) => v.status === 'disable');
    if (hasDisabled) {
      await updateChatStatusActive({ id: chatId });
    }

    const [{ target }] = await selectChatStatus({ id: chatId, creator });
    await insertAlarm({ source: creator, target, chatId, type: 'chat' });

    const insert = await insertChatMessage({
      chatId,
      creator,
      message,
      type,
    });
    await updateChatlastChatId({
      chatId,
      lastChatId: insert.insertId,
    });
    const [select] = await selectChatMessageById({ id: insert.insertId });
    setTimeout(() => {
      return res.json(select);
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json(error);
  }
});

router.post('/disable', async (req, res) => {
  const { chatId, creator } = req.body;
  if ((!chatId, !creator)) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const updated = await disableChat({ chatId, creator });
    setTimeout(() => {
      return res.json(updated);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
