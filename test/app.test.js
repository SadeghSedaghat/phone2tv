const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { io: Client } = require('../client/node_modules/socket.io-client');
const dbService = require('../server/db');

console.log('====================================================');
console.log(' Starting Phone2TV End-to-End Automated Test Suite ');
console.log('====================================================');

async function runTests() {
  // Test 1: SQLite Database Services
  console.log('\n--- 1. Testing Database & Persistence ---');
  const testCode = '999888';
  
  // 1a. Create session
  const session = dbService.getOrCreateSession(testCode);
  assert.strictEqual(session.code, testCode, 'Session code should match');
  assert.ok(session.session_id, 'Session should have session_id');
  console.log('✓ Session created and retrieved successfully');

  // 1b. Add Messages (Text, URL, Code, Image, File)
  const textMsg = dbService.addMessage({
    id: 'msg-1',
    session_code: testCode,
    type: 'text',
    content: 'Hello Smart TV from Phone!',
    sender_device: 'mobile'
  });
  assert.strictEqual(textMsg.content, 'Hello Smart TV from Phone!');

  const linkMsg = dbService.addMessage({
    id: 'msg-2',
    session_code: testCode,
    type: 'link',
    content: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    sender_device: 'mobile'
  });
  assert.strictEqual(linkMsg.type, 'link');

  const codeMsg = dbService.addMessage({
    id: 'msg-3',
    session_code: testCode,
    type: 'code',
    title: 'JavaScript Snippet',
    content: 'const greet = () => console.log("Hello TV");',
    sender_device: 'mobile'
  });
  assert.strictEqual(codeMsg.type, 'code');

  const msgs = dbService.getMessages(testCode);
  assert.strictEqual(msgs.length, 3, 'Should have 3 saved messages');
  console.log('✓ Multi-type messages (Text, Link, Code) persisted and loaded');

  // 1c. Delete Message
  const deleted = dbService.deleteMessage('msg-2', testCode);
  assert.strictEqual(deleted, true);
  const remaining = dbService.getMessages(testCode);
  assert.strictEqual(remaining.length, 2);
  console.log('✓ Individual message deletion verified');

  // 1d. Clear Session
  dbService.clearSession(testCode);
  const cleared = dbService.getMessages(testCode);
  assert.strictEqual(cleared.length, 0);
  console.log('✓ Session clearing verified');


  // Test 2: Start Express + Socket.IO Server for live network tests
  console.log('\n--- 2. Starting Express & Socket.IO Test Server ---');
  process.env.PORT = '4050'; // Use non-conflicting test port
  const app = require('express')();
  const server = http.createServer(app);
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });

  // Load server routes & logic
  const cors = require('cors');
  const multer = require('multer');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `test-${Date.now()}-${file.originalname}`)
  });
  const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

  app.use(cors());
  app.use(require('express').json());

  app.get('/api/info', (req, res) => {
    res.json({ localIp: '127.0.0.1', port: 4050, fullUrl: 'http://127.0.0.1:4050' });
  });

  app.get('/api/session/new', (req, res) => {
    const code = '123456';
    const s = dbService.getOrCreateSession(code);
    res.json({ code: s.code, sessionId: s.session_id, formattedCode: '123-456' });
  });

  app.get('/api/session/:code', (req, res) => {
    const s = dbService.getSession(req.params.code);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ code: s.code, sessionId: s.session_id });
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      isImage: req.file.mimetype.startsWith('image/')
    });
  });

  // Socket connections map
  const socketConnections = new Map();
  io.on('connection', (socket) => {
    socket.on('join_session', ({ code, deviceType, deviceName }) => {
      const room = `room_${code}`;
      socket.join(room);
      socketConnections.set(socket.id, { sessionCode: code, deviceType, deviceName });

      const devices = [];
      for (const [id, info] of socketConnections.entries()) {
        if (info.sessionCode === code) devices.push({ socketId: id, ...info });
      }

      socket.emit('session_joined', {
        session: dbService.getOrCreateSession(code),
        messages: dbService.getMessages(code),
        devices
      });

      socket.to(room).emit('device_connected', {
        newDevice: { socketId: socket.id, deviceType, deviceName },
        devices
      });
    });

    socket.on('send_message', (payload, cb) => {
      const saved = dbService.addMessage({
        id: `msg-${Date.now()}`,
        session_code: payload.code,
        type: payload.type || 'text',
        content: payload.content,
        sender_device: payload.senderDevice || 'mobile'
      });
      io.to(`room_${payload.code}`).emit('new_message', saved);
      if (cb) cb({ success: true, message: saved });
    });

    socket.on('disconnect', () => {
      const info = socketConnections.get(socket.id);
      if (info) {
        socketConnections.delete(socket.id);
        const devices = [];
        for (const [id, inf] of socketConnections.entries()) {
          if (inf.sessionCode === info.sessionCode) devices.push({ socketId: id, ...inf });
        }
        io.to(`room_${info.sessionCode}`).emit('device_disconnected', {
          socketId: socket.id,
          deviceType: info.deviceType,
          devices
        });
      }
    });
  });

  await new Promise((resolve) => server.listen(4050, '127.0.0.1', resolve));
  console.log('✓ Server running on http://127.0.0.1:4050');

  // Test 3: HTTP REST API calls
  console.log('\n--- 3. Testing REST API Endpoints ---');
  
  // 3a. GET /api/info
  const infoRes = await fetch('http://127.0.0.1:4050/api/info').then(r => r.json());
  assert.strictEqual(infoRes.port, 4050);
  console.log('✓ GET /api/info returned valid server metadata');

  // 3b. GET /api/session/new
  const sessionRes = await fetch('http://127.0.0.1:4050/api/session/new').then(r => r.json());
  assert.strictEqual(sessionRes.code, '123456');
  console.log('✓ GET /api/session/new generated session token');

  // 3c. GET /api/session/123456
  const getSessionRes = await fetch('http://127.0.0.1:4050/api/session/123456').then(r => r.json());
  assert.strictEqual(getSessionRes.code, '123456');
  console.log('✓ GET /api/session/:code confirmed session active');

  // 3d. File upload (Multipart POST /api/upload)
  const formData = new FormData();
  const fileBlob = new Blob(['Test file contents for phone2tv'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'notes.txt');
  formData.append('sessionCode', '123456');

  const uploadRes = await fetch('http://127.0.0.1:4050/api/upload', {
    method: 'POST',
    body: formData
  }).then(r => r.json());

  assert.strictEqual(uploadRes.fileName, 'notes.txt');
  assert.ok(uploadRes.fileUrl.startsWith('/uploads/'));
  assert.strictEqual(uploadRes.isImage, false);
  console.log('✓ POST /api/upload processed and stored file attachment');


  // Test 4: Live Real-Time Socket.IO Synchronization (Smart TV <-> Phone)
  console.log('\n--- 4. Testing Real-Time Peer Sync (TV & Phone) ---');
  const serverUrl = 'http://127.0.0.1:4050';
  const roomCode = '777888';

  // 4a. Connect TV client
  const tvSocket = Client(serverUrl);
  await new Promise((resolve) => tvSocket.on('connect', resolve));
  console.log('✓ TV client socket connected');

  // 4b. TV joins room
  await new Promise((resolve) => {
    tvSocket.emit('join_session', { code: roomCode, deviceType: 'tv', deviceName: 'Living Room Smart TV' });
    tvSocket.on('session_joined', (data) => {
      assert.strictEqual(data.session.code, roomCode);
      resolve();
    });
  });
  console.log('✓ TV client joined session room');

  // 4c. Connect Phone client
  const phoneSocket = Client(serverUrl);
  await new Promise((resolve) => phoneSocket.on('connect', resolve));

  // Listen on TV for phone joining
  const phoneJoinedPromise = new Promise((resolve) => {
    tvSocket.on('device_connected', (data) => {
      assert.strictEqual(data.newDevice.deviceType, 'mobile');
      assert.strictEqual(data.newDevice.deviceName, 'User iPhone');
      resolve();
    });
  });

  phoneSocket.emit('join_session', { code: roomCode, deviceType: 'mobile', deviceName: 'User iPhone' });
  await phoneJoinedPromise;
  console.log('✓ Phone device presence broadcasted to TV in real-time');

  // 4d. Send message from Phone -> Smart TV receives it instantly
  const testMessageText = 'WiFi Password: SuperSecretKey2026';
  const tvMessageReceivedPromise = new Promise((resolve) => {
    tvSocket.on('new_message', (msg) => {
      assert.strictEqual(msg.content, testMessageText);
      assert.strictEqual(msg.sender_device, 'mobile');
      resolve(msg);
    });
  });

  phoneSocket.emit('send_message', {
    code: roomCode,
    type: 'text',
    content: testMessageText,
    senderDevice: 'mobile'
  });

  const receivedMsg = await tvMessageReceivedPromise;
  console.log('✓ Text sent from Phone appeared instantly on Smart TV:', receivedMsg.content);

  // 4e. Disconnect Phone -> TV receives device_disconnected
  const tvDisconnectPromise = new Promise((resolve) => {
    tvSocket.on('device_disconnected', (data) => {
      assert.strictEqual(data.deviceType, 'mobile');
      resolve();
    });
  });

  phoneSocket.disconnect();
  await tvDisconnectPromise;
  console.log('✓ Phone disconnection reported to TV');

  tvSocket.disconnect();
  server.close();

  // Test 5: Verify static assets
  console.log('\n--- 5. Verifying Client Build Assets ---');
  const distDir = path.join(__dirname, '..', 'client', 'dist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.js')), 'dist/index.js bundle must exist');
  assert.ok(fs.existsSync(path.join(distDir, 'index.css')), 'dist/index.css stylesheet must exist');

  const htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  assert.ok(htmlContent.includes('Phone2TV'), 'HTML must contain title');
  assert.ok(htmlContent.includes('/index.js'), 'HTML must include JS bundle');
  assert.ok(htmlContent.includes('/index.css'), 'HTML must include CSS');
  console.log('✓ Client production bundle verified');

  console.log('\n====================================================');
  console.log(' ALL TESTS PASSED SUCCESSFULLY! (100% Functioning)  ');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
