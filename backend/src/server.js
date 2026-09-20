const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { seed } = require('./db/seed');
const { setupWebsocket } = require('./websocket/index');

seed();

const server = http.createServer(app);
const io = setupWebsocket(server, env.corsOrigin === '*' ? true : env.corsOrigin.split(','));
app.set('io', io);

server.listen(env.port, () => {
  console.log(`[freelancerhub-api] listening on http://localhost:${env.port}`);
});
