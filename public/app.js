const API = '/api/tasks';
let tasks = [];
let filter = 'all';
let editingId = null;

const $ = (id) => document.getElementById(id);
const form = $('task-form');
const list = $('task-list');
const msg = $('message');
let msgTimer;

function showMsg(text, isError = true) {
  clearTimeout(msgTimer);
  msg.textContent = text;
  msg.className = isError ? 'error' : 'ok';
  msgTimer = setTimeout(() => { msg.textContent = ''; msg.className = ''; }, 4000);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch (e) { data = null; }
  }
  if (!res.ok) throw new Error((data && data.error) || 'Request failed (' + res.status + ')');
  return data;
}

async function loadTasks() {
  try {
    tasks = await api(API);
    render();
  } catch (err) {
    showMsg('Could not load tasks: ' + err.message);
  }
}

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const visible = tasks.filter((t) => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (q && !(t.title + ' ' + (t.description || '')).toLowerCase().includes(q)) return false;
    return true;
  });

  const done = tasks.filter((t) => t.completed).length;
  $('stats').textContent = tasks.length + ' total • ' + (tasks.length - done) + ' active • ' + done + ' completed';

  list.innerHTML = '';
  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No tasks to show.';
    list.appendChild(li);
    return;
  }

  const today = todayStr();
  visible.forEach((t) => {
    const li = document.createElement('li');
    li.className = t.priority + (t.completed ? ' done' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.completed;
    cb.setAttribute('aria-label', 'Mark complete');
    cb.addEventListener('change', () => updateTask(t.id, { completed: cb.checked }));

    const content = document.createElement('div');
    content.className = 'content';
    const title = document.createElement('strong');
    title.textContent = t.title;
    content.appendChild(title);
    if (t.description) {
      const d = document.createElement('div');
      d.className = 'desc';
      d.textContent = t.description;
      content.appendChild(d);
    }
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = 'Priority: ' + t.priority;
    if (t.due_date) {
      meta.appendChild(document.createTextNode(' • Due: ' + t.due_date + ' '));
      if (!t.completed && t.due_date < today) {
        const o = document.createElement('span');
        o.className = 'overdue';
        o.textContent = '(overdue)';
        meta.appendChild(o);
      }
    }
    content.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => startEdit(t.id));
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'del';
    del.addEventListener('click', () => deleteTask(t.id));
    actions.append(edit, del);

    li.append(cb, content, actions);
    list.appendChild(li);
  });
}

async function updateTask(id, changes) {
  try {
    const updated = await api(API + '/' + id, { method: 'PUT', body: JSON.stringify(changes) });
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    render();
  } catch (err) {
    showMsg(err.message);
    render();
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await api(API + '/' + id, { method: 'DELETE' });
    tasks = tasks.filter((t) => t.id !== id);
    if (editingId === id) resetForm();
    render();
    showMsg('Task deleted.', false);
  } catch (err) {
    showMsg(err.message);
  }
}

function startEdit(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  $('title').value = t.title;
  $('description').value = t.description || '';
  $('priority').value = t.priority;
  $('due_date').value = t.due_date || '';
  $('submit-btn').textContent = 'Save Changes';
  $('cancel-btn').hidden = false;
  $('title').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  form.reset();
  $('priority').value = 'medium';
  $('submit-btn').textContent = 'Add Task';
  $('cancel-btn').hidden = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    priority: $('priority').value,
    due_date: $('due_date').value || null,
  };
  if (!payload.title) return showMsg('Please enter a task title.');

  try {
    if (editingId === null) {
      const created = await api(API, { method: 'POST', body: JSON.stringify(payload) });
      tasks.unshift(created);
      showMsg('Task added.', false);
    } else {
      const updated = await api(API + '/' + editingId, { method: 'PUT', body: JSON.stringify(payload) });
      tasks = tasks.map((t) => (t.id === editingId ? updated : t));
      showMsg('Task updated.', false);
    }
    resetForm();
    render();
  } catch (err) {
    showMsg(err.message);
  }
});

$('cancel-btn').addEventListener('click', resetForm);
$('search').addEventListener('input', render);
document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

loadTasks();
