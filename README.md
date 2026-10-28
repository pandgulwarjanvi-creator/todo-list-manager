# To Do List Manager

Full-stack app: **HTML/CSS/JavaScript** (frontend) + **Node.js/Express** (backend) + **Supabase PostgreSQL** (database).

Features: add, edit, delete, complete tasks; priority; due date (overdue highlight); search; filters; stats.

## 1. Install required software
1. **Node.js LTS (v18 or newer)** - https://nodejs.org  (check: `node -v` and `npm -v`)
2. A code editor, e.g. **VS Code** - https://code.visualstudio.com (optional)
3. A free **Supabase** account - https://supabase.com

## 2. Set up the database (Supabase)
1. Create a new project on Supabase (note your database password).
2. Open **SQL Editor -> New query**, paste everything from `supabase/schema.sql`, click **Run**.
3. Open **Project Settings -> API** and copy:
   - **Project URL**
   - **service_role** key (shown as "secret" key in newer dashboards)
   Keep this key private. Never put it in frontend code or upload it to GitHub.

## 3. Configure the project
1. Unzip the folder and open a terminal inside it.
2. Copy `.env.example` to `.env`:
   - Windows: `copy .env.example .env`
   - Mac/Linux: `cp .env.example .env`
3. Open `.env` and paste your URL and key:
   ```
   SUPABASE_URL=https://abcdxyz.supabase.co
   SUPABASE_KEY=your-service-role-key
   PORT=3000
   ```

## 4. Install and run
```
npm install
npm start
```
Open **http://localhost:3000** in your browser.

## API
| Method | URL | Purpose |
|---|---|---|
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create a task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |

## Troubleshooting
- **"Missing SUPABASE_URL or SUPABASE_KEY"**: the file must be named `.env` (not `.env.txt`) and sit next to `server.js`.
- **"Could not load tasks" / relation "tasks" does not exist**: run `supabase/schema.sql` in the SQL Editor.
- **Invalid API key**: copy the full key again, no spaces or quotes.
- **Port in use**: change `PORT` in `.env` to 3001.
- **Slow internet in hostel**: `npm install` only needs to run once.

## Folder structure
```
todo-list-manager/
├── server.js
├── package.json
├── .env.example
├── supabase/schema.sql
└── public/ (index.html, style.css, app.js)
```
