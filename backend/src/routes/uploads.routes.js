const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
    cb(null, `${id('file')}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new ApiError(400, 'That file type is not supported. Try an image, PDF, Word doc or zip.'));
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file was uploaded.');
  const { requestId } = req.body;
  const aid = id('att');
  db.prepare(
    `INSERT INTO attachments (id, owner_id, request_id, filename, original_name, mime_type, size) VALUES (?,?,?,?,?,?,?)`
  ).run(aid, req.user.id, requestId || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  res.status(201).json({
    attachment: {
      id: aid,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
    },
  });
}));

module.exports = router;
