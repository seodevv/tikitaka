const logger = require('../../lib/logger');
const { selectAllMenus } = require('../../lib/query/menu');
const { selectUser } = require('../../lib/query/user');

const router = require('express').Router();

router.use('/chat', require('../chat/getChat'));
router.use('/social', require('../social/getSocial'));
router.use('/feed', require('../feed/getFeed'));
router.use('/alarm', require('../alarm/getAlarm'));

router.get('/menus', async (req, res) => {
  try {
    const result = await selectAllMenus();
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.get('/user', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }
  try {
    const result = await selectUser({ id });
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
