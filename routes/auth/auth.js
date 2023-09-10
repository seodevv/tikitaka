const {
  insertUser,
  selectPasswordUser,
  selectUser,
  insertOauthUser,
  selectUserByNick,
} = require('../../lib/query/user');
const { mailFormat, userInfoObject } = require('../../lib/common');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

const router = require('express').Router();

const createTokenCookie = (object, res) => {
  delete object.password;
  const token = jwt.sign(object, process.env.TOKEN_SECRET);
  res.cookie('token', token, {
    sameSite: 'none',
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

router.post('/signup', async (req, res) => {
  const { id, password } = req.body;
  const nick = `${id.split('@')[0]}-${parseInt(Math.random() * 100000)}`;

  if (!id || !password) {
    res.json({ error: true, message: 'bad request' });
    return;
  }

  const decryptedPassword = CryptoJS.AES.decrypt(
    password,
    process.env.CRYPTO_SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  try {
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
    const result = await insertUser({
      userId: id,
      password: hashedPassword,
      nick,
    });
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

router.post('/duplicate', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }
  try {
    const [result] = await selectPasswordUser({ userId });
    if (result) {
      setTimeout(() => {
        res.json({ duplicate: true });
      }, 1000);

      return;
    }
    setTimeout(() => {
      res.json({ duplicate: false });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

router.get('/nickDuplicated', async (req, res) => {
  const { nick } = req.query;
  if (!nick) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    const [check] = await selectUserByNick({ nick });
    if (check) {
      setTimeout(() => {
        res.json({ duplicated: true });
      }, 300);
      return;
    }
    setTimeout(() => {
      res.json({ duplicated: false });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/compare', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  const decryptedPassword = CryptoJS.AES.decrypt(
    password,
    process.env.CRYPTO_SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  try {
    const [result] = await selectUser({
      userId,
    });
    if (result) {
      const compared = await bcrypt.compare(decryptedPassword, result.password);

      if (compared) {
        createTokenCookie(result, res);
      }

      setTimeout(() => {
        res.json({
          compared,
          userInfo: userInfoObject(result),
          already: result.login ? true : false,
        });
      });
      return;
    }
    setTimeout(() => {
      res.json({ compared: false });
    }, 1000);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error });
  }
});

router.get('/getUserInfo', async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      userInfo: null,
      message: 'please login',
    });
  }

  const tokenData = jwt.verify(token, process.env.TOKEN_SECRET);
  try {
    const [result] = await selectUser({
      type: tokenData.type,
      id: tokenData.id,
    });
    if (result) {
      return res.json({
        success: true,
        userInfo: userInfoObject(result),
        already: result.login ? true : false,
      });
    }
    setTimeout(() => {
      return res.json({
        success: false,
        userInfo: null,
        message: 'user not found',
      });
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'server error', error });
  }
});

router.post('/logout', async (req, res) => {
  res.cookie('token', '', {
    sameSite: 'none',
    httpOnly: true,
    secure: true,
    maxAge: 0,
  });
  setTimeout(() => {
    res.json({ success: true, message: 'ok' });
  });
});

const nodeMailer = require('nodemailer');
router.post('/sendAuthCode', async (req, res) => {
  const { type, target } = req.body;

  if (!type || !target) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  const creator = process.env.EMAIL_SENDER_ID;
  const pass = process.env.EMAIL_SENDER_APP_PASSWORD;
  const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: { user: creator, pass: pass },
  });

  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  const mailOptions = {
    to: target,
    subject: `[TikiTaka] ${type === 'signup' ? '가입' : '이메일'} 인증 메일`,
    html: mailFormat(type, creator, target, randomString),
  };
  try {
    const result = await transporter.sendMail(mailOptions);
    const encryptCode = CryptoJS.AES.encrypt(
      randomString,
      process.env.CRYPTO_SECRET_KEY
    ).toString();

    setTimeout(() => {
      res.json({ status: 'success', data: result.response, code: encryptCode });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/oauthLogin', async (req, res) => {
  const { type, id, email, name, picture } = req.body;

  try {
    const [check] = await selectUser({ type, userId: id });

    if (check) {
      createTokenCookie(check, res);
      return res.json({
        userInfo: userInfoObject(check),
        already: check.login ? true : false,
      });
    }

    const insertId = await insertOauthUser({
      type,
      id,
      email,
      name,
      picture,
    });
    const [result] = await selectUser({ type, id: insertId });
    createTokenCookie(result, res);
    setTimeout(() => {
      return res.json({
        userInfo: userInfoObject(result),
        already: result.login ? true : false,
      });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

const axios = require('axios');
const url = require('url');
const logger = require('../../lib/logger');
router.get('/callback/:type', async (req, res) => {
  const { code, state } = req.query;
  const { type } = req.params;

  try {
    let getInfo;
    let tokenResponse;
    switch (type) {
      case 'naver': {
        const client_id = process.env.OAUTH_NAVER_CLIENT_ID;
        const client_secret = process.env.OAUTH_NAVER_SECRET;
        const getToken = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${code}&state=${state}`;
        getInfo = `https://openapi.naver.com/v1/nid/me`;
        tokenResponse = await axios.get(getToken);
        break;
      }
      case 'github': {
        const client_id = process.env.OAUTH_GITHUB_CLIENT_ID;
        const client_secret = process.env.OAUTH_GITHUB_SECRET;
        const getToken = 'https://github.com/login/oauth/access_token';
        getInfo = 'https://api.github.com/user';
        tokenResponse = await axios({
          method: 'post',
          url: getToken,
          headers: {
            accept: 'application/json',
          },
          data: {
            client_id,
            client_secret,
            code,
          },
        });
        break;
      }
    }

    const {
      data: { access_token },
    } = tokenResponse;

    const config = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };
    const { data } = await axios.get(getInfo, config);

    let id;
    let nickname;
    let profile_image;
    let email;
    switch (type) {
      case 'naver':
        id = data.response.id;
        nickname = data.response.nickname;
        profile_image = data.response.profile_image;
        email = data.response.email;
        break;
      case 'github':
        id = data.id;
        nickname = data.login;
        profile_image = data.avatar_url;
        email = data.email;
        break;
    }

    const [check] = await selectUser({ type, userId: id });
    if (check) {
      createTokenCookie(check, res);
      res.redirect(
        url.format({
          pathname: '/login',
          query: {
            type,
            userInfo: JSON.stringify(userInfoObject(check)),
            already: check.login ? true : false,
          },
        })
      );
      return;
    }

    const insertId = await insertOauthUser({
      type,
      id,
      email,
      name: nickname,
      picture: profile_image,
    });
    const [result] = await selectUser({ type, id: insertId });
    createTokenCookie(result, res);
    res.redirect(
      url.format({
        pathname: '/login',
        query: {
          type,
          userInfo: JSON.stringify(userInfoObject(result)),
          already: result.login ? true : false,
        },
      })
    );
  } catch (error) {
    logger.error(error);
    res.redirect(`/login?error=true`);
  }
});

module.exports = { userInfoObject };
module.exports = router;
