const { selectSubscribe } = require('./query/subscribe');

const userInfoObject = (response) => ({
  id: response.id,
  type: response.type,
  userId: response.userId,
  email: response.email,
  nick: response.nick,
  birth: response.birth,
  profile: response.profile,
  regist: response.regist,
});

const mailFormat = (type, creator, target, otp) => {
  return `<div style="margin: 50px auto; display: block; width: 600px;">
  <table style="padding: 15px; border: 1px solid #999; border-radius: 5px; font-family: sans-serif;">
      <thead>
          <tr style="text-align: center;">
              <td style="padding: 15px 30px; font-weight: bold; border-bottom: 1px solid #777">
                  <img src="https://seodevv.github.io/tikitaka.png" alt="logo" width="200px">
                  <h2 style="margin: 0;">
                  ${type === 'signup' ? '가입' : '이메일'} 인증 메일
                  </h2>
              </td>
          </tr>
      </thead>
      <tbody>
          <tr>
              <td style="padding: 0 20px;">
                  <p style="margin: 15px 0;"><strong
                          style="color: #0f8a81; font-size: larger;"><u>Tiki-Taka</u></strong>
                      로부터 ${
                        type === 'signup' ? '가입' : '이메일'
                      } 인증이 신청되었습니다.</p>
                  <p style="margin: 5px 0; font-size: 0.9rem;"><strong style="font-size: 1rem; text-decoration: underline;">${target}</strong> 사용자가 맞으시다면,</p>
                  <p style="margin: 5px 0; font-size: 0.9rem;">아래 인증 코드를 Application 에 입력해주세요.</p>
                  <h1 style="margin: 30px 0; text-align: center; text-decoration: underline;">${otp}</h1>
                  <p style="margin: 5px 0; font-size: 0.9rem;">이 코드는 1회성으로 재사용되지 않습니다.</p>
                  <p style="margin: 5px 0; font-size: 0.9rem;"><strong style="font-size: 1rem; text-decoration: underline;">${creator}</strong> 주소를 모르신다면 이 이메일을 무시하시기 바랍니다.</p>
              </td>
          </tr>
      </tbody>
  </table>
</div>`;
};

const getKoreaDate = (date) => {
  const offset = new Date().getTimezoneOffset() * 60000;
  if (date) {
    return new Date(date - offset);
  }
  return new Date(Date.now() - offset);
};

const getFormatDate = (date, separator = '-') => {
  const year = date.getFullYear();
  const month =
    date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  const result = `${year}${separator}${month}${separator}${day}`;

  return result;
};

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const file = fs.readFileSync(
  path.resolve(__dirname, '../vapidKeys.json'),
  'utf8'
);
const vapidKeys = JSON.parse(file);
webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.vapidPublic,
  vapidKeys.vapidPrivate
);

const creatorProfileURL = (url) => {
  return /^http?s/.test(url)
    ? url
    : `https://localhost:8080/img/profile/${url}`;
};

const creatorSocialURL = ({ creator, type, thumbnail, media }) => {
  let socialURL;
  switch (type) {
    case 'image':
      const split = media.split('/');
      socialURL = `https://localhost:8080/img/social/${creator}/${split[0]}`;
      break;
    case 'video':
      socialURL = `https://localhost:8080/video/social/${creator}/${thumbnail}`;
      break;
    default:
      break;
  }
  return socialURL;
};

const pushNotification = async ({ data }) => {
  if (!data) {
    return;
  }

  try {
    const select = await selectSubscribe({ userId: data.target });
    if (select.length === 0) return;
    let title;
    let body;
    let image;
    switch (data.type) {
      case 'like':
        title = `${data.sourceNick}님의 좋아요`;
        body = `${data.sourceNick}님이 회원님의 포스트를 좋아합니다.`;
        image = creatorSocialURL({
          creator: data.target,
          type: data.socialType,
          thumbnail: data.socialThumbnail,
          media: data.socialMedia,
        });
        break;
      case 'reply':
        title = `${data.sourceNick}님의 댓글`;
        body = `${data.sourceNick}님이 회원님의 포스트에 댓글을 남겼습니다.`;
        image = creatorSocialURL({
          creator: data.target,
          type: data.socialType,
          thumbnail: data.socialThumbnail,
          media: data.socialMedia,
        });
        break;
      case 'follow':
        title = '팔로우';
        body = `${data.sourceNick}님이 회원님을 팔로우했습니다.`;
        image = creatorProfileURL(data.sourceProfile);
        break;
      case 'chat':
        title = `${data.sourceNick}님의 메시지`;
        body = `${data.sourceNick}님이 회원님에게 메시지를 보냈습니다.`;
        image = creatorProfileURL(data.sourceProfile);
        break;
    }

    select.forEach((v) => {
      const pushSubscription = {
        endpoint: v.endpoint,
        keys: {
          p256dh: v.p256dh,
          auth: v.auth,
        },
      };
      webpush
        .sendNotification(
          pushSubscription,
          JSON.stringify({ title, body, image })
        )
        .catch(() => {});
    });
  } catch (error) {
    logger.error(error);
    return;
  }
};

module.exports = {
  userInfoObject,
  mailFormat,
  getKoreaDate,
  getFormatDate,
  pushNotification,
};
