const router = require('express').Router();
const logger = require('../../lib/logger');
const {
  selectAlarmCount,
  selectAlarmByTarget,
} = require('../../lib/query/alarm');

router.get('/list', async (req, res) => {
  const { target } = req.query;
  if (!target) {
    return res.status(400).json({ success: false, message: 'bad reqest' });
  }

  try {
    const result = await selectAlarmByTarget({ target });
    setTimeout(() => {
      return res.json({ success: true, result, message: 'ok' });
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: true, error, message: 'server error' });
  }
});

router.get('/count', async (req, res) => {
  const { target } = req.query;

  if (!target) {
    return res.status(400).json({ success: false, message: 'bad request' });
  }

  try {
    const { count } = await selectAlarmCount({ target });
    setTimeout(() => {
      return res.json({ success: true, count, message: 'ok' });
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, error, message: 'server error' });
  }
});

module.exports = router;
