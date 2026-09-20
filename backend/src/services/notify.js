const db = require('../db');
const { id } = require('../utils/ids');

const insertStmt = db.prepare(
  `INSERT INTO notifications (id, user_id, type, title, body, link, is_read, created_at)
   VALUES (?,?,?,?,?,?,0, datetime('now'))`
);

function notifyUser(io, userId, { type, title, body, link }) {
  const nid = id('ntf');
  insertStmt.run(nid, userId, type, title, body || null, link || null);
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(nid);
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
  return notification;
}

module.exports = { notifyUser };
