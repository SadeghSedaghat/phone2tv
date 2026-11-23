# Phone2TV 📺📱
> Instant, frictionless cross-device sharing from Smartphone to Smart TV with remote control clipboard copying.

**Send from one device, receive and copy from another.**

---

## 1. Overview

**Phone2TV** is a modern, lightweight web application designed for seamless transfer of text, web links, code snippets, photos, and documents between any smartphone and a Smart TV (or any secondary web browser).

No user account or app installation is required. Simply open the URL, scan the QR code or enter the 6-digit pairing code, and whatever you send on your phone pops up instantly on the big screen with a prominent **COPY** button navigable via your Smart TV remote.

---

## 2. Key Features

### 📡 Device Pairing
- **6-Digit Pairing Codes:** Numeric `XXX-XXX` format that is easy to type using a TV remote on-screen keyboard.
- **Instant QR Code Pairing:** TV screen displays a dynamic QR code with the server's local Wi-Fi URL. Scanning with a smartphone camera pairs the phone in 1 click.
- **Auto-Join Links:** Visiting `http://<ip>:3000/?code=123456` immediately links the session without manual input.
- **Live Device Presence:** Real-time badges show when TV or phone connects, disconnects, or is active.
- **Session Privacy:** Each session has a unique unguessable UUID session token in SQLite. Inactive sessions auto-expire after 24 hours.

### 📱 Mobile Sender Interface (Phone-First)
- **Smart Input Area:** Support for plain text, long notes, URLs, code snippets, images, and file attachments up to 25 MB.
- **Paste from Clipboard:** One-tap paste button (`navigator.clipboard.readText()`) with fallback prompt.
- **Smart URL Detection:** Recognizes web links (e.g. YouTube, Twitch, articles) and provides direct **"Open Link"** buttons on TV.
- **Code Snippet Highlighting:** Monospace container with line counter and language selector (JavaScript, Python, HTML, Bash, SQL, etc.).
- **Photo & Document Uploads:** Instant camera capture or file picker with upload progress and thumbnail preview.
- **Sent History:** Real-time delivery confirmation badges, individual delete buttons, and Clear All option.

### 📺 Smart TV Receiver Interface (10-Foot UI)
- **High-Contrast Dark Theme:** Optimized for couch viewing (Background `#09090B`, Cards `#18181B`, Accent `#6366F1`, Text `#FAFAFA`).
- **Spatial TV Remote Navigation (D-Pad):**
  - **Arrow Keys (▲ ▼ ◄ ►):** Spatial navigation between cards and action buttons.
  - **OK / Enter:** Triggers immediate copying or link opening.
  - **Back / Escape:** Dismisses modals.
  - **Sound Effects:** Gentle audio chimes generated using Web Audio API on navigation and successful actions.
  - **Glow Focus Indicator:** High-contrast indigo glow border and scale transform so users never lose cursor position.
- **Prominent COPY Button:** Large button on every card with instant feedback (`✓ COPIED TO TV CLIPBOARD!`).
- **3-Tier Clipboard Fallback:**
  1. *Tier 1:* Modern Async Clipboard API (`navigator.clipboard.writeText`)
  2. *Tier 2:* Hidden selectable textarea (`document.execCommand('copy')`)
  3. *Tier 3:* Smart TV Manual Copy Dialog: Displays auto-selected text with on-screen remote control instructions (*"Press Menu or Options on your TV remote to select Copy"*).

---

## 3. Technology Stack

- **Backend:** Node.js, Express, Socket.IO
- **Database:** SQLite with Node 26 built-in `node:sqlite` (zero native dependency overhead, WAL mode enabled)
- **Frontend:** React 19, Tailwind CSS, Lucide Icons, QRCode.react
- **Bundler:** Zero-native WebAssembly compilation (`esbuild-wasm` + PostCSS Tailwind compiler)
- **Storage:** Local isolated uploads with UUID filenames and auto-cleanup

---

## 4. Quick Start

### Prerequisites
- Node.js v18+ (tested and optimized on Node v26)
- Modern web browser on phone and Smart TV

### 1. Installation
Clone repository and install dependencies:
```bash
npm install
```

### 2. Build Client (Production)
```bash
npm run build
```

### 3. Start Server
```bash
npm start
```
The server will print:
```
===============================================
 Phone2TV Server is listening on:
  - Local:   http://localhost:3000
  - Network: http://192.168.1.54:3000
===============================================
```

---

## 5. How to Use

1. **On your Smart TV:**
   - Open your TV's built-in web browser (Samsung Tizen, LG webOS, Android TV Chrome, Fire TV Silk, etc.).
   - Navigate to `http://<your-network-ip>:3000` (e.g. `http://192.168.1.54:3000`).
   - Click or select **"Display on TV"**. A large pairing code and QR code will appear.

2. **On your Phone:**
   - Either scan the TV's QR code using your camera app, **OR** open `http://<your-network-ip>:3000` on your mobile browser and enter the 6-digit code.
   - Your phone is now paired to your TV!

3. **Send & Copy:**
   - Type or paste anything on your phone, then tap **"Send to TV"**.
   - Content instantly appears on the TV screen.
   - Use the TV remote arrow keys and press **OK** on the large **COPY** button.

---

## 6. Running Tests

Run the automated end-to-end test suite:
```bash
npm test
```
Verifies SQLite persistence, session isolation, file uploads, and live real-time bidirectional Socket.IO synchronization between TV and Phone.

---

## 7. Production Deployment & Hosting

### Option A: PM2 (Node Process Manager)
```bash
npm install -g pm2
pm2 start server/index.js --name "phone2tv"
pm2 startup
```

### Option B: Docker
```dockerfile
FROM node:26-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option C: Reverse Proxy with HTTPS (Nginx / Caddy)
For Smart TV browsers to allow full unrestricted Clipboard API access, running over HTTPS or local network is recommended.
```caddy
phone.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 8. License
MIT License.
