const router = require('express').Router();
const sharp = require('sharp');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const {
  insertChatMessageImage,
  selectChatMessageById,
  updateChatlastChatId,
  updateChatStatusActive,
} = require('../../lib/query/chat');
const { updateUserProfile, selectUserById } = require('../../lib/query/user');
const { userInfoObject } = require('../../lib/common');
const { insertSocial } = require('../../lib/query/social');
const { insertTag } = require('../../lib/query/tags');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type, chatId, creator } = req.body;

    let dir;
    switch (type) {
      case 'message':
        dir = path.join(__dirname, `../../public/img/chat/${chatId}/`);
        break;
      case 'profile':
        dir = path.join(__dirname, `../../public/img/profile/`);
        break;
      case 'social':
        dir = path.join(__dirname, `../../public/img/social/${creator}/`);
        break;
      case 'temp':
        dir = `public/temp/`;
        break;
    }
    try {
      const exist = fs.existsSync(dir);
      if (!exist) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (error) {
      logger.error(error);
      cb(new Error('Server error: check upload directory'), false);
    }
  },
  filename: (req, file, cb) => {
    const newFileName =
      new Date().valueOf() + '_' + path.basename(file.originalname);
    cb(null, newFileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const { type } = req.body;
    const ext = path.extname(file.originalname).toLowerCase();

    let allowedExt;
    switch (type) {
      case 'message':
      case 'profile':
        allowedExt = ['.png', '.jpg', '.jpeg', '.gif'];
        break;
      case 'social':
        allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov'];
        break;
      case 'temp':
        allowedExt = ['.mp4', '.mov'];
        break;
      default:
        allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov'];
        break;
    }
    if (!allowedExt.includes(ext)) {
      cb(new Error('Please upload image file'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 100, // 100MB
  },
});

const unlink = (file) =>
  new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

const resize = async (file, maxSize) => {
  let filename = file.filename;
  try {
    const image = await sharp(file.path);
    const { width } = await image.metadata();
    if (width > maxSize) {
      await image
        .resize({ width: maxSize })
        .withMetadata()
        .toFile(`${file.destination}/r_${file.filename}`);
      await unlink(file.path);
      filename = `r_${file.filename}`;
    }
    return filename;
  } catch (error) {
    throw error;
  }
};

router.post('/image', upload.single('image'), async (req, res) => {
  const { chatId, creator } = req.body;

  try {
    await updateChatStatusActive({ id: chatId });
    let filename = await resize(req.file, 1920);

    const insert = await insertChatMessageImage({
      chatId,
      creator,
      filename,
    });
    await updateChatlastChatId({ chatId, lastChatId: insert.insertId });
    const [result] = await selectChatMessageById({ id: insert.insertId });
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/profile', upload.single('profile'), async (req, res) => {
  const { id, email, nick, birth } = req.body;

  if (!id) {
    res.status(400).json({ error: true, message: 'bad request' });
    return;
  }

  try {
    let [select] = await selectUserById({ id });

    let profile;
    if (req.file) {
      profile = await resize(req.file, 300);
      if (
        select.profile !== 'profile.png' &&
        select.profile.search(/^http/) === -1
      ) {
        await unlink(req.file.destination + select.profile);
      }
    }

    await updateUserProfile({ id, email, nick, birth, profile });
    select.email = email ? email : select.email;
    select.nick = nick ? nick : select.nick;
    select.birth = birth ? new Date(birth) : select.birth;
    select.profile = profile ? profile : select.profile;
    setTimeout(() => {
      res.json({ userInfo: userInfoObject(select) });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/social', upload.array('media'), async (req, res) => {
  const { creator, location, post, tags, mediaType } = req.body;
  let media = '';
  let thumbnail = '';

  try {
    if (mediaType === 'image') {
      for (let i = 0; i < req.files.length; i++) {
        const result = await resize(req.files[i], 1920);
        if (i === 0) {
          media += result;
        } else {
          media += `/${result}`;
        }
      }
    } else if (mediaType === 'video') {
      media = req.body.video;
      thumbnail = req.body.thumbnail;
    }
    const result = await insertSocial({
      userId: creator,
      location: location,
      type: mediaType,
      thumbnail: thumbnail,
      media: media,
      content: post,
      tags: tags,
    });
    if (tags.length > 1) {
      await insertTag({ socialId: result.insertId, tags: tags });
    }
    setTimeout(() => {
      res.json(result);
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json(error);
  }
});

router.post('/video/temp/add', upload.single('video'), (req, res) => {
  const result = {
    url: req.file.path,
    filename: req.file.filename,
  };
  setTimeout(() => {
    res.json(result);
  });
});

const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../lib/logger');
const ffprobe = (url) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url, (err, metadata) => {
      if (err) {
        logger.error(err);
        reject(err);
      }
      const duration = metadata.format.duration;
      const meta = metadata.streams[0];
      const ratio = meta.height / meta.width;
      resolve({ duration, ratio });
    });
  });
router.post('/thumbnail', async (req, res) => {
  const { url, width } = req.body;

  let path;
  let thumbnails;
  let duration;
  try {
    const getInfo = await ffprobe(url);
    duration = getInfo.duration;
    ratio = getInfo.ratio;
  } catch (error) {
    logger.error(error);
    return res.json({
      success: false,
      error,
    });
  }

  ffmpeg(url)
    .on('filenames', (filenames) => {
      path = 'temp/';
      thumbnails = filenames;
    })
    .on('end', () => {
      setTimeout(() => {
        return res.json({
          success: true,
          path,
          thumbnails,
          duration,
        });
      });
    })
    .on('error', (error) => {
      logger.error(error);
      return res.json({ success: false, error });
    })
    .screenshots({
      count: parseInt(duration),
      folder: 'public/temp',
      size: `${width}x?`,
      filename: 'thumbnail-%b.png',
    });
});

router.post('/video/temp/delete', (req, res) => {
  const { creator, filename = '', thumbnails = [] } = req.body;
  let path;
  if (creator) {
    path = `public/video/social/${creator}`;
  } else {
    path = 'public/temp';
  }

  const deleteArray = [filename, ...thumbnails];

  if (deleteArray.length === 0) {
    return res.json({ success: false, message: 'target unknown' });
  }

  try {
    deleteArray.forEach((file) => {
      if (file === '') return;
      const filename = `${path}/${file}`;
      const exist = fs.existsSync(filename);
      if (exist) {
        fs.unlink(filename, (error) => {
          if (error) logger.error(error);
          logger.info(filename, 'deleted');
        });
      }
    });
    setTimeout(() => {
      return res.json({ success: true, message: 'success to request' });
    });
  } catch (error) {
    logger.error(error);
    return res.json({ success: false, error });
  }
});

router.post('/video/temp/edit', (req, res) => {
  const { creator, video } = req.body;
  const source = 'public/temp';
  const target = `public/video/social/${creator}`;

  const exist = fs.existsSync(target);
  if (!exist) {
    fs.mkdirSync(target, { recursive: true });
  }

  ffmpeg(`${source}/${video.filename}`)
    .setStartTime(video.startTime * video.duration)
    .duration(video.totalTime)
    .size('640x?')
    .save(`${target}/${video.filename}`)
    .on('end', () => {
      const deleteArray = [...video.thumbnails, video.filename];
      const thumbnail = video.thumbnails[video.thumbnail];
      deleteArray.forEach((file, i) => {
        if (file === '' || video.thumbnail === i) return;
        const filename = `${source}/${file}`;
        const exist = fs.existsSync(filename);
        if (exist) {
          fs.unlink(filename, (error) => {
            if (error) logger.error(error);
            logger.info(filename, 'deleted');
          });
        }
      });
      fs.rename(`${source}/${thumbnail}`, `${target}/${thumbnail}`, (error) => {
        if (error) {
          logger.error(error);
          return res.json({ success: false, error });
        }
        setTimeout(() => {
          return res.json({
            success: true,
            video: `${video.filename}`,
            thumbnail: `${thumbnail}`,
          });
        });
      });
    })
    .on('error', (error) => {
      logger.error(error);
      return res.json({ success: false, error });
    });
});

module.exports = router;
