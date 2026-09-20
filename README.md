# FreelancerHub

FreelancerHub is a marketplace that connects people who need work completed with
freelancers who can help. Users can publish requests, discover services and
providers, send offers, chat, manage projects and leave reviews.

## Features

- Create and publish work requests
- Discover freelancers, services and requests
- Compare and accept offers
- Manage projects, milestones and deliveries
- Real-time messaging with polling fallback
- Notifications, saved items and reviews
- Admin dashboard and provider verification
- Demo data included

## Technology

- **Frontend:** React, Vite, Tailwind CSS and React Router
- **Backend:** Node.js, Express and Socket.IO
- **Database:** SQLite
- **Authentication:** JWT and bcrypt

## Requirements

- Node.js 22 LTS recommended
- npm 9 or newer

No separate database server is required. SQLite is created automatically.

## Quick start

Open a terminal in the project folder and run:

```bash
# Install backend and frontend dependencies
npm run setup

# Start the backend and frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

The backend runs at **http://localhost:4000**. The database is created and
seeded automatically the first time the application starts.

## Run the servers separately

```bash
# Start only the backend
npm run dev:backend

# Start only the frontend
npm run dev:frontend
```

## Demo accounts

All seeded accounts use the password **`demo1234`**.

| Role | Email | Example content |
|---|---|---|
| Business | `arun@aruncafe.demo` | Requests and received offers |
| Student | `rahul@dev.demo` | Recommended requests and sent offers |
| Professional | `arjun@fullstack.demo` | Services, portfolio and projects |
| Admin | `admin@freelancerhub.demo` | Platform management dashboard |

You can also use the **Explore as...** buttons on the login page.

## Useful commands

```bash
# Build the frontend for production
npm run build

# Preview the production frontend
npm run preview

# Reseed the database
npm run seed
```

## Testing

Start the backend before running the API tests:

```bash
# API tests
npm run test:api

# Browser tests
npm run test:ui
npm run test:lifecycle
```

Browser tests require Puppeteer and Chrome:

```bash
npm install puppeteer
npx puppeteer browsers install chrome
```

## Configuration

The application works with the default settings. To customise the backend,
copy `backend/.env.example` to `backend/.env` and update the values.

Common settings include:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Backend port |
| `JWT_SECRET` | Demo value | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `DB_PATH` | `./data/freelancerhub.db` | SQLite database location |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend URL |
| `UPLOAD_DIR` | `./uploads` | Uploaded files location |

Change `JWT_SECRET` before using the application in production.

## Troubleshooting

### Port already in use

Change `PORT` in `backend/.env`. If the backend port changes, update the proxy
target in `frontend/vite.config.js` as well.

### Reset the demo database

Stop the application, delete the `backend/data/` folder, and run `npm run dev`
again. The database will be recreated with fresh demo data.

### Native SQLite installation error

If you see an error saying that `better-sqlite3` was compiled for a different
Node.js version, use Node.js 22 LTS and rebuild the backend dependency:

```powershell
nvm use 22.14.0
npm --prefix backend install
npm --prefix backend rebuild better-sqlite3
npm run dev
```

On Windows, the rebuild may require Visual Studio Build Tools with the
**Desktop development with C++** workload.

## License

Demo project provided for evaluation and portfolio purposes.
