const logger = require('../../lib/logger');
const { updateAlarmIsRead } = require('../../lib/query/alarm');

const router = require('express').Router();

router.post('/isRead', async (req, res) => {
  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    await updateAlarmIsRead({ target });
    setTimeout(() => {
      return res.json({ success: true, message: 'ok' });
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, error, message: 'server error' });
  }
});

module.exports = router;
