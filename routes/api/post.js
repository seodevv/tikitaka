const logger = require('../../lib/logger');
const { selectSearchUsers } = require('../../lib/query/user');
const router = require('express').Router();

router.use('/chat', require('../chat/postChat'));
router.use('/social', require('../social/postSocial'));
router.use('/feed', require('../feed/postFeed'));
router.use('/upload', require('../upload/postUpload'));
router.use('/alarm', require('../alarm/postAlarm'));

router.post('/searchUsers', async (req, res) => {
  const { searchId, id } = req.body;
  if (!searchId || !id) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }
  try {
    const result = await selectSearchUsers({
      searchId,
      id,
    });
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
