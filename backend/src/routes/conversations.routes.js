const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('../services/notify');

const router = express.Router();

function otherPartyFields(userRole) {
  return userRole === 'client'
    ? { idCol: 'provider_id', selfCol: 'client_id' }
    : { idCol: 'client_id', selfCol: 'provider_id' };
}

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const isClient = req.user.role === 'client';
  const selfCol = isClient ? 'client_id' : 'provider_id';
  const otherCol = isClient ? 'provider_id' : 'client_id';

  const rows = db.prepare(
    `SELECT conv.*, u.name AS other_name, u.avatar_url AS other_avatar,
       (SELECT content FROM messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conv.id AND m.sender_id != ? AND m.read_at IS NULL) AS unread_count,
       p.title AS project_title
     FROM conversations conv
     JOIN users u ON u.id = conv.${otherCol}
     LEFT JOIN projects p ON p.id = conv.project_id
     WHERE conv.${selfCol} = ?
     ORDER BY conv.last_message_at DESC`
  ).all(req.user.id, req.user.id);

  res.json({ conversations: rows });
}));

router.get('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) throw new ApiError(404, 'This conversation could not be found.');
  if (conv.client_id !== req.user.id && conv.provider_id !== req.user.id) {
    throw new ApiError(403, 'You are not part of this conversation.');
  }

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id);
  db.prepare(`UPDATE messages SET read_at = datetime('now') WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`)
    .run(conv.id, req.user.id);

  res.json({ conversation: conv, messages });
}));

// Start (or fetch) a conversation with another user, optionally scoped to a project.
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { otherUserId, projectId } = req.body;
  const other = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(otherUserId);
  if (!other) throw new ApiError(404, 'This user could not be found.');
  if (other.role === req.user.role) throw new ApiError(400, 'Messaging works between a client and a provider.');

  const clientId = req.user.role === 'client' ? req.user.id : other.id;
  const providerId = req.user.role === 'provider' ? req.user.id : other.id;

  let conv = db.prepare(
    `SELECT * FROM conversations WHERE client_id = ? AND provider_id = ? AND (project_id IS ? OR project_id = ?)`
  ).get(clientId, providerId, projectId || null, projectId || null);

  if (!conv) {
    const cid = id('conv');
    db.prepare('INSERT INTO conversations (id, project_id, client_id, provider_id) VALUES (?,?,?,?)')
      .run(cid, projectId || null, clientId, providerId);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(cid);
  }

  res.status(201).json({ conversation: conv });
}));

router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) throw new ApiError(404, 'This conversation could not be found.');
  if (conv.client_id !== req.user.id && conv.provider_id !== req.user.id) {
    throw new ApiError(403, 'You are not part of this conversation.');
  }
  const { content } = req.body;
  if (!content || !content.trim()) throw new ApiError(400, 'Please write a message before sending.');

  const mid = id('msg');
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?,?,?,?)')
    .run(mid, conv.id, req.user.id, content.trim());
  db.prepare(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?`).run(conv.id);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(mid);
  const otherUserId = conv.client_id === req.user.id ? conv.provider_id : conv.client_id;

  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conv.id}`).emit('message:new', { conversationId: conv.id, message });
  }
  notifyUser(io, otherUserId, {
    type: 'message', title: 'New message',
    body: `${req.user.name} sent you a message.`,
    link: `/messages/${conv.id}`,
  });

  res.status(201).json({ message });
}));

module.exports = router;
