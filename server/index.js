const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const dbService = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const PORT = process.env.PORT || 3000;

// Directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for uploaded files and images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max limit
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Helper: Get Primary Local IPv4 Address
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Helper: Generate random 6-digit code
function generateUniqueCode() {
  let code = '';
  let attempts = 0;
  while (attempts < 100) {
    // 6-digit numeric string from 100000 to 999999
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = dbService.getSession(code);
    if (!existing) return code;
    attempts++;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// REST API Endpoints

// Server status & local IP info (for TV pairing QR code display)
app.get('/api/info', (req, res) => {
  const localIp = getLocalIp();
  res.json({
    localIp,
    port: PORT,
    fullUrl: `http://${localIp}:${PORT}`
  });
});

// Create/Get a new session
app.get('/api/session/new', (req, res) => {
  const code = generateUniqueCode();
  const sessionId = uuidv4();
  const session = dbService.getOrCreateSession(code, sessionId);
  res.json({
    code: session.code,
    sessionId: session.session_id,
    formattedCode: `${session.code.slice(0, 3)}-${session.code.slice(3)}`
  });
});

// Check if a session code is valid
app.get('/api/session/:code', (req, res) => {
  const code = req.params.code.replace(/[^0-9]/g, '');
  const session = dbService.getSession(code);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const messages = dbService.getMessages(code);
  res.json({
    code: session.code,
    sessionId: session.session_id,
    formattedCode: `${session.code.slice(0, 3)}-${session.code.slice(3)}`,
    messageCount: messages.length,
    lastActive: session.last_active
  });
});

// File / Image upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const sessionCode = req.body.sessionCode ? req.body.sessionCode.replace(/[^0-9]/g, '') : null;
  if (!sessionCode) {
    // Remove orphaned file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Session code required' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    isImage: req.file.mimetype.startsWith('image/')
  });
});

// In-memory tracking of connected sockets: socketId -> { sessionCode, deviceType, deviceName }
const socketConnections = new Map();

function getDevicesInSession(code) {
  const devices = [];
  for (const [id, info] of socketConnections.entries()) {
    if (info.sessionCode === code) {
      devices.push({
        socketId: id,
        deviceType: info.deviceType,
        deviceName: info.deviceName
      });
    }
  }
  return devices;
}

// Socket.IO Real-Time Handlers
io.on('connection', (socket) => {
  // Join a session room
  socket.on('join_session', ({ code, deviceType = 'browser', deviceName = 'Device' }) => {
    if (!code) return;
    const cleanCode = code.toString().replace(/[^0-9]/g, '');
    
    // Ensure session exists in DB
    const session = dbService.getOrCreateSession(cleanCode);
    const roomName = `room_${cleanCode}`;
    
    socket.join(roomName);
    socketConnections.set(socket.id, {
      sessionCode: cleanCode,
      deviceType,
      deviceName
    });

    const messages = dbService.getMessages(cleanCode);
    const devices = getDevicesInSession(cleanCode);

    // Notify joining socket
    socket.emit('session_joined', {
      session,
      messages,
      devices
    });

    // Notify other peers in room
    socket.to(roomName).emit('device_connected', {
      newDevice: { socketId: socket.id, deviceType, deviceName },
      devices
    });
  });

  // Sending a message (Text, Link, Code, Image, File)
  socket.on('send_message', (payload, callback) => {
    const { code, type, content, title, fileName, fileSize, fileType, senderDevice = 'mobile' } = payload;
    if (!code || !content) {
      if (typeof callback === 'function') callback({ error: 'Missing parameters' });
      return;
    }

    const cleanCode = code.toString().replace(/[^0-9]/g, '');
    const messageId = uuidv4();

    try {
      const savedMsg = dbService.addMessage({
        id: messageId,
        session_code: cleanCode,
        type: type || 'text',
        content,
        title: title || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        file_type: fileType || null,
        sender_device: senderDevice
      });

      const roomName = `room_${cleanCode}`;
      // Broadcast to everyone in room including sender
      io.to(roomName).emit('new_message', savedMsg);

      if (typeof callback === 'function') {
        callback({ success: true, message: savedMsg });
      }
    } catch (err) {
      console.error('Error saving message:', err);
      if (typeof callback === 'function') {
        callback({ error: 'Failed to process message' });
      }
    }
  });

  // Delete individual message
  socket.on('delete_message', ({ code, messageId }, callback) => {
    if (!code || !messageId) return;
    const cleanCode = code.toString().replace(/[^0-9]/g, '');
    const success = dbService.deleteMessage(messageId, cleanCode);
    
    if (success) {
      const roomName = `room_${cleanCode}`;
      io.to(roomName).emit('message_deleted', { messageId });
      if (typeof callback === 'function') callback({ success: true });
    } else {
      if (typeof callback === 'function') callback({ error: 'Message not found' });
    }
  });

  // Clear all messages in session
  socket.on('clear_session', ({ code }, callback) => {
    if (!code) return;
    const cleanCode = code.toString().replace(/[^0-9]/g, '');
    dbService.clearSession(cleanCode, uploadsDir);

    const roomName = `room_${cleanCode}`;
    io.to(roomName).emit('session_cleared');

    if (typeof callback === 'function') callback({ success: true });
  });

  // Disconnection
  socket.on('disconnect', () => {
    const info = socketConnections.get(socket.id);
    if (info) {
      const { sessionCode, deviceType } = info;
      socketConnections.delete(socket.id);
      const roomName = `room_${sessionCode}`;
      const devices = getDevicesInSession(sessionCode);
      io.to(roomName).emit('device_disconnected', {
        socketId: socket.id,
        deviceType,
        devices
      });
    }
  });
});

// Client production build static files
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
} else {
  // If dist not built yet, friendly notice
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family:sans-serif;background:#09090B;color:#FAFAFA;padding:40px;text-align:center;">
        <h1 style="color:#6366F1;">Phone2TV Server Running</h1>
        <p>Vite client is in development mode or not built yet.</p>
        <p>Server local IP: <strong>${getLocalIp()}:${PORT}</strong></p>
      </div>
    `);
  });
}

// Periodic cleanup of sessions older than 24h
setInterval(() => {
  try {
    const cleaned = dbService.cleanupOldSessions(24 * 60 * 60 * 1000, uploadsDir);
    if (cleaned > 0) {
      console.log(`[Phone2TV] Auto-cleaned ${cleaned} expired sessions`);
    }
  } catch (err) {
    console.error('Session cleanup error:', err);
  }
}, 60 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`===============================================`);
  console.log(` Phone2TV Server is listening on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Network: http://${localIp}:${PORT}`);
  console.log(`===============================================`);
});
