require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const server = https.createServer(
  {
    key: fs.readFileSync(__dirname + '/.cert/key.pem', 'utf-8'),
    cert: fs.readFileSync(__dirname + '/.cert/cert.pem', 'utf-8'),
  },
  app
);

const { updateLoginUser } = require('./lib/query/user.js');
const logger = require('./lib/logger.js');
const morgan = require('morgan');

// cors policy config
const corsOptions = {
  origin: [
    'http://localhost:5500',
    'https://localhost:8080',
    'https://tikitaka.io',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};

// webSocket cors policy
const io = require('socket.io')(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

// http logger
app.use(
  morgan(':method :status :url :response-time ms', { stream: logger.stream })
);

// public config
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routing
app.use('/auth', require('./routes/auth/auth.js'));
app.use('/webpush', require('./routes/api/webPush.js'));
app.use('/get', require('./routes/api/get.js'));
app.use('/post', require('./routes/api/post.js'));

// litening the server
const serverHost = process.env.SERVER_HOST || '0.0.0.0';
const serverPort = process.env.SERVER_PORT || 443;
// let server;
// if (fs.existsSync('.cert/key.pem') && fs.existsSync('.cert/cert.pem')) {
// server = https
//   .createServer(
//     {
//       key: fs.readFileSync(__dirname + '/.cert/key.pem', 'utf-8'),
//       cert: fs.readFileSync(__dirname + '/.cert/cert.pem', 'utf-8'),
//     },
//     app
//   )
//   .listen(serverPort, serverHost, () => {
//     logger.info(`litening on https://${serverHost}:${serverPort}`);
//   });
// } else {
//   server = app.listen(serverPort, serverHost, () => {
//     logger.info(`litening on http://${serverHost}:${serverPort}`);
//   });
// }
server.listen(serverPort, serverHost, () => {
  logger.info(`litening on https://${serverHost}:${serverPort}`);
});

// socket.io connection
const clients = [];
io.on('connection', (socket) => {
  logger.info(`[${socket.id}] user connected`);
  socket.on('login', async (data) => {
    try {
      await updateLoginUser({ id: data.id, login: true });

      const newClient = new Object();
      newClient.id = socket.id;
      newClient.userId = data.id;
      clients.push(newClient);
    } catch (error) {
      logger.error(error);
    }
  });

  socket.on('disconnect', async (data) => {
    logger.info(`[${socket.id}] user disconnected`);
    const index = clients.findIndex((client) => client.id === socket.id);
    if (index !== -1) {
      try {
        await updateLoginUser({ id: clients[index].userId, login: false });
        clients.splice(index, 1);
      } catch (error) {
        logger.error(error);
      }
    }
  });

  socket.on('sendMessageToTarget', (data) => {
    for (client of clients) {
      if (client.userId === data.target) {
        logger.info(`[${socket.id}] send Message To [${client.id}]`);
        io.to(client.id).emit('receiveMessageFromTarget', data);
      }
    }
  });

  socket.on('sendTypingToTarget', (data) => {
    for (client of clients) {
      if (client.userId === data.target) {
        logger.info(`[${socket.id}] send Typing To [${client.id}]`);
        io.to(client.id).emit('receiveTargetFromTarget', data);
      }
    }
  });
});

// routing react js
app.get('/bundle.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, './dist/bundle.js'));
});
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, './dist/service-worker.js'));
});

// routing react
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './dist/index.html'));
});
