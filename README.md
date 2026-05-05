# MAX Connectivity 🚀

> Private, distraction-free communication platform for small groups.
> No feeds. No reels. No ads. Just real conversations + memes.

---

## 🏗️ Project Structure

```
max-connectivity/
├── backend/                  # Node.js + Express + MongoDB
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── friendController.js
│   │   ├── messageController.js
│   │   ├── memeController.js
│   │   ├── userController.js
│   │   └── groupController.js
│   ├── middleware/auth.js     # JWT middleware
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── FriendRequest.js
│   │   ├── Message.js
│   │   ├── Meme.js
│   │   └── Group.js
│   ├── routes/               # Express routers
│   ├── socket/socketHandler.js  # Socket.io real-time logic
│   ├── data/memes.json       # Meme dataset
│   ├── scripts/seedMemes.js  # DB seeder
│   ├── server.js             # Entry point
│   └── .env.example
│
└── frontend/                 # Next.js + Tailwind PWA
    ├── public/
    │   ├── manifest.json     # PWA manifest
    │   ├── sw.js             # Service worker
    │   └── icons/            # App icons (add manually)
    ├── src/
    │   ├── pages/
    │   │   ├── index.js      # Redirect
    │   │   ├── login.js      # Auth page
    │   │   ├── chats.js      # Chat list
    │   │   ├── chat/[conversationId].js  # Chat screen
    │   │   ├── friends.js    # Friend requests
    │   │   ├── search.js     # User search
    │   │   └── profile.js    # Profile + stats
    │   ├── components/
    │   │   ├── ui/Avatar.js
    │   │   ├── chat/MessageBubble.js
    │   │   └── meme/MemePanel.js
    │   ├── context/authStore.js  # Zustand auth store
    │   ├── hooks/useSocket.js   # Socket.io hook
    │   ├── utils/api.js         # Axios API client
    │   └── styles/globals.css
    └── .env.example
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### Step 1: Clone & Setup

```bash
# If you extracted the ZIP:
cd max-connectivity

# Or clone from your repo:
git clone <your-repo-url>
cd max-connectivity
```

---

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET

# Seed meme database
npm run seed

# Start dev server
npm run dev
# ✅ Server runs on http://localhost:5000
```

**Backend .env:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/max-connectivity
JWT_SECRET=change_this_to_something_very_long_and_random
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Default values work for local dev

# Start dev server
npm run dev
# ✅ App runs on http://localhost:3000
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

### Step 4: Add PWA Icons

Create a folder `frontend/public/icons/` and add PNG icons:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-192x192.png
- icon-512x512.png

**Quick way:** Use https://realfavicongenerator.net or https://pwa-image-generator.com with your logo.

---

## 🌐 Deployment Guide

### Option A: Deploy to Railway (Recommended - Free)

#### Backend:
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → Choose `backend` folder as root
3. Add environment variables (same as .env)
4. Railway auto-detects Node.js and deploys
5. Get your backend URL: `https://your-app.railway.app`

#### Frontend:
1. New service in same Railway project → GitHub → `frontend` folder
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
   - `NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app`

---

### Option B: Vercel (Frontend) + Render (Backend)

**Backend on Render:**
1. https://render.com → New Web Service
2. Connect GitHub, select backend folder
3. Build: `npm install`
4. Start: `node server.js`
5. Add env variables

**Frontend on Vercel:**
```bash
cd frontend
npx vercel --prod
# Set env vars in Vercel dashboard
```

---

### Option C: VPS (DigitalOcean / Hetzner)

```bash
# On your VPS:
sudo apt update && sudo apt install -y nodejs npm nginx mongodb

# Clone repo
git clone <your-repo> /var/www/max-connectivity

# Backend
cd /var/www/max-connectivity/backend
npm install
npm run seed
# Use PM2 to keep it running:
npm install -g pm2
pm2 start server.js --name "max-backend"
pm2 save && pm2 startup

# Frontend
cd ../frontend
npm install
npm run build
pm2 start npm --name "max-frontend" -- start
pm2 save

# Nginx config:
# Point port 80 → frontend (3000)
# Point /api and /socket.io → backend (5000)
```

---

## 📱 Installing as PWA on Android

1. Open Chrome on Android
2. Navigate to your app URL
3. Tap the ⋮ menu → "Add to Home Screen"
4. Tap "Install"
5. App installs like a native app! 🎉

---

## 🔑 API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |
| PUT | /api/auth/profile | ✅ | Update profile |
| GET | /api/users/search?q= | ✅ | Search users |
| POST | /api/friends/request | ✅ | Send friend request |
| PUT | /api/friends/respond | ✅ | Accept/reject request |
| GET | /api/friends | ✅ | Get friend list |
| GET | /api/friends/pending | ✅ | Get pending requests |
| GET | /api/messages/:convId | ✅ | Get messages |
| POST | /api/messages | ✅ | Send message (REST) |
| GET | /api/memes/search?q= | ✅ | Search memes |
| GET | /api/memes/trending | ✅ | Trending memes |
| POST | /api/groups | ✅ | Create group |
| GET | /api/groups | ✅ | Get my groups |

## ⚡ Socket Events

| Event (emit) | Description |
|---|---|
| `join_conversation` | Join a chat room |
| `send_message` | Send a real-time message |
| `typing_start` | Notify typing started |
| `typing_stop` | Notify typing stopped |
| `react_message` | Add emoji reaction |
| `mark_read` | Mark messages as read |

| Event (listen) | Description |
|---|---|
| `receive_message` | Incoming message |
| `user_typing` | Someone is typing |
| `user_stop_typing` | Stopped typing |
| `user_status` | Online/offline change |
| `message_reacted` | Reaction added |
| `messages_read` | Read receipt |
| `new_message_notification` | New message alert |

---

## 🎭 Meme Engine

The meme search uses a 3-tier ranking system:
1. **Exact match** (score: 100 + usage) — keyword/tag exact match
2. **Partial match** (score: 50 + usage) — substring match
3. **Token match** (score: 25 + usage) — individual word matching

Input `"wtf bro"` → matches keywords `wtf`, `bro`, `bruh`, `disbelief` → returns top-ranked memes.

Add more memes to `backend/data/memes.json` and re-run `npm run seed`.

---

## ✨ Features

- 🔐 JWT auth with bcrypt password hashing
- 💬 Real-time chat with Socket.io
- 🎭 Smart meme search engine (keyword + partial + token matching)
- 👥 Friend system (send/accept/reject)
- 🌐 Group chats
- ⚡ Emoji reactions (double-tap = ❤️)
- 📖 Reply to messages
- ✓ Read receipts
- 🟢 Online presence indicators
- 📊 Gamification (streaks, badges, stats)
- 📱 PWA — installable on Android
- 🌙 Full dark theme
- ⚡ Optimistic UI updates

---

Built with ❤️ — MAX Connectivity
