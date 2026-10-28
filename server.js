require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Create a .env file (see .env.example).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRIORITIES = ['low', 'medium', 'high'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Validate + clean incoming data. Returns { data } or { error }
function clean(body, partial) {
  const out = {};
  if (!partial || body.title !== undefined) {
    const t = typeof body.title === 'string' ? body.title.trim() : '';
    if (!t || t.length > 200) return { error: 'Title is required (max 200 characters).' };
    out.title = t;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return { error: 'Invalid description.' };
    out.description = body.description.trim().slice(0, 1000);
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return { error: 'Priority must be low, medium or high.' };
    out.priority = body.priority;
  }
  if (body.due_date !== undefined) {
    if (body.due_date === null || body.due_date === '') out.due_date = null;
    else if (typeof body.due_date === 'string' && DATE_RE.test(body.due_date)) out.due_date = body.due_date;
    else return { error: 'Invalid due date.' };
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') return { error: 'Invalid completed value.' };
    out.completed = body.completed;
  }
  return { data: out };
}

function validId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid task id.' });
    return null;
  }
  return id;
}

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CREATE a task
app.post('/api/tasks', async (req, res) => {
  const { data: row, error: vErr } = clean(req.body || {}, false);
  if (vErr) return res.status(400).json({ error: vErr });
  const { data, error } = await supabase.from('tasks').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// UPDATE a task (partial updates allowed)
app.put('/api/tasks/:id', async (req, res) => {
  const id = validId(req, res);
  if (id === null) return;
  const { data: row, error: vErr } = clean(req.body || {}, true);
  if (vErr) return res.status(400).json({ error: vErr });
  if (Object.keys(row).length === 0) return res.status(400).json({ error: 'Nothing to update.' });
  const { data, error } = await supabase.from('tasks').update(row).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Task not found.' });
  res.json(data[0]);
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
  const id = validId(req, res);
  if (id === null) return;
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

// Unknown API route
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Malformed JSON and other errors
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.status === 400 ? 'Invalid JSON.' : 'Server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`To Do List Manager running at http://localhost:${PORT}`));
