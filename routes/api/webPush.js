const {
  insertSubscribe,
  deleteSubscribe,
} = require('../../lib/query/subscribe');

const router = require('express').Router();

const fs = require('fs');
const path = require('path');
const logger = require('../../lib/logger');
router.get('/getKey', (req, res) => {
  try {
    const file = fs.readFileSync(
      path.resolve(__dirname, '../../vapidKeys.json')
    );
    const vapidKeys = JSON.parse(file);

    return res.json({
      success: true,
      result: { key: vapidKeys.vapidPublic },
      message: 'ok',
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, error, message: 'server error' });
  }
});

router.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }
  try {
    await insertSubscribe({ subscription, userId });
    return res.json({ success: true, message: 'ok' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, error, message: 'server error' });
  }
});

router.post('/unSubscribe', async (req, res) => {
  const { endpoint, userId } = req.body;
  if (!endpoint || !userId) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }
  try {
    await deleteSubscribe({ endpoint, userId });
    return res.json({ success: true, message: 'ok' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, error, message: 'server error' });
  }
});

module.exports = router;
