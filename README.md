# 💎 ExpenseManager

A full-stack personal finance web app for couples — track income, expenses, a shared weekly budget, debts, and todos. Built with the MERN stack and deployable to Render.

---

## Features

- 🔐 Auth (register / login / JWT cookie sessions)
- 💞 Partner linking via invite codes
- 💰 Income tracking (filter by date range)
- 💳 Expenses (Personal & Shared, filter by type/category/date)
- 📊 Shared weekly budget with progress bar, 80%/over-budget warnings, per-person breakdown, 8-week history chart
- 🤝 Debt tracking (I Owe / Owed to Me, partial payments, auto-calculated remaining)
- ✅ Todo list (priority, due dates, All/Pending/Done filter)
- 📱 Mobile-first, bottom navigation, dark mode

---

## Project Structure

```
Money_Balancing/
├── api/index.js              # Vercel serverless entry
├── backend/
│   ├── config/db.js          # Cached MongoDB connection
│   ├── controllers/          # Business logic
│   ├── middleware/auth.js    # JWT middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # Express routes
│   └── app.js                # Express app
├── frontend/                 # Vite + React + Tailwind
│   └── src/
│       ├── api/              # Axios helpers
│       ├── components/       # Reusable UI components
│       ├── context/          # AuthContext
│       ├── pages/            # Route pages
│       └── utils.js          # Formatters & constants
├── scripts/seed.js           # Sample data seed
├── render.yaml               # Render deployment config
├── vercel.json               # Vercel deployment config (optional)
├── .env.example
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)

### 1. Clone & install

```bash
git clone <repo-url>
cd Money_Balancing

# Install backend deps
npm install

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Create MongoDB Atlas cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create a free cluster
2. Create a database user (remember the password)
3. Add your IP to the Network Access list (or allow all: `0.0.0.0/0`)
4. Click **Connect → Drivers** and copy the connection string

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/expensemanager?retryWrites=true&w=majority
JWT_SECRET=some_long_random_secret_string_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### 4. Run locally

Open **two terminals**:

```bash
# Terminal 1 – Backend
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Seed sample data (optional)

```bash
npm run seed
```

This creates two pre-linked demo accounts:
- **user1@demo.com** / `password123` (Ashan)
- **user2@demo.com** / `password123` (Kavya)

---

## Deploy to Render

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Create a Web Service in Render

1. Go to [render.com](https://render.com) → **New +** → **Blueprint**
2. Connect your GitHub account and select this repository
3. Render will detect `render.yaml` and prefill the service settings

### 3. Set environment variables in Render

In **Service → Environment**, set:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random secret |
| `CLIENT_URL` | `https://your-service-name.onrender.com` |
| `NODE_ENV` | `production` |

### 4. Deploy

Click **Apply** / **Deploy**. Render will:
- Install backend + frontend dependencies
- Build the React frontend into `frontend/dist`
- Start the Node/Express server and serve both API + frontend from one service

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/generate-invite` | Generate invite code |
| POST | `/api/auth/link-partner` | Link with partner code |
| POST | `/api/auth/unlink-partner` | Unlink partner |
| GET/POST | `/api/income` | List / Create income |
| PUT/DELETE | `/api/income/:id` | Update / Delete |
| GET/POST | `/api/expenses` | List / Create expenses |
| PUT/DELETE | `/api/expenses/:id` | Update / Delete |
| GET/PUT | `/api/budget` | Get / Update shared budget |
| GET/POST | `/api/debts` | List / Create debts |
| PUT/DELETE | `/api/debts/:id` | Update / Delete |
| POST | `/api/debts/:id/payments` | Add payment |
| DELETE | `/api/debts/:id/payments/:pid` | Remove payment |
| GET/POST | `/api/todos` | List / Create todos |
| PUT/DELETE | `/api/todos/:id` | Update / Delete |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router 6, Recharts |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Auth | bcryptjs, JWT, httpOnly cookies |
| Deploy | Render (single web service) |
