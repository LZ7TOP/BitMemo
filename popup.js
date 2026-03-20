// Storage key
const STORAGE_KEY = 'quick_notes_lz7';

// State
let notes = [];
let currentTab = 'all';

// DOM Elements
const notesList = document.getElementById('notesList');
const searchInput = document.getElementById('searchInput');
const tabBtns = document.querySelectorAll('.tab-btn');
const addBtn = document.getElementById('addBtn');
const noteModal = document.getElementById('noteModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

const noteType = document.getElementById('noteType');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');

// Initialize
async function init() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  notes = data[STORAGE_KEY] || [];
  renderNotes();
}

// Render Notes
function renderNotes() {
  const searchTerm = searchInput.value.toLowerCase();
  
  const filteredNotes = notes.filter(note => {
    const matchesTab = currentTab === 'all' || note.type === currentTab;
    const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                         note.content.toLowerCase().includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  notesList.innerHTML = filteredNotes.length > 0 
    ? filteredNotes.map(note => createNoteCard(note)).join('')
    : `<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">暂无记录</div>`;

  // Attach event listeners to dynamic elements
  attachCardEvents();
}

function createNoteCard(note) {
  const typeLabels = { text: '文本', link: '链接', code: '代码' };
  const contentClass = note.type === 'code' ? 'note-content code' : 'note-content';
  
  return `
    <div class="note-card" data-id="${note.id}">
      <div class="note-header">
        <div class="note-title">${note.title || '无标题'}</div>
        <div class="note-type-icon">${typeLabels[note.type]}</div>
      </div>
      <div class="${contentClass}">${escapeHtml(note.content)}</div>
      <div class="card-actions">
        ${note.type === 'code' ? `<button class="action-btn format" data-id="${note.id}">格式化</button>` : ''}
        <button class="action-btn copy" data-id="${note.id}">复制</button>
        <button class="action-btn delete" data-id="${note.id}">删除</button>
      </div>
    </div>
  `;
}

// Logic functions
async function saveNote() {
  const newNote = {
    id: Date.now().toString(),
    type: noteType.value,
    title: noteTitle.value,
    content: noteContent.value,
    timestamp: new Date().toISOString()
  };

  if (newNote.type === 'code') {
    newNote.content = formatCode(newNote.content);
  }

  notes.unshift(newNote);
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
  
  closeModal();
  renderNotes();
}

async function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
  renderNotes();
}

function formatCode(code) {
  // Simple indentation formatter as a basic "formatting" feature
  try {
    const lines = code.split('\n');
    let indent = 0;
    return lines.map(line => {
      line = line.trim();
      if (line.match(/[}\]]/)) indent = Math.max(0, indent - 1);
      const formatted = '  '.repeat(indent) + line;
      if (line.match(/[{[]/)) indent++;
      return formatted;
    }).join('\n');
  } catch (e) {
    return code;
  }
}

function copyNote(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    navigator.clipboard.writeText(note.content);
    // Visual feedback could be added here
  }
}

// Event Handlers
function attachCardEvents() {
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteNote(btn.dataset.id);
    };
  });

  document.querySelectorAll('.action-btn.copy').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      copyNote(btn.dataset.id);
    };
  });

  document.querySelectorAll('.action-btn.format').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const note = notes.find(n => n.id === btn.dataset.id);
      if (note) {
        note.content = formatCode(note.content);
        chrome.storage.local.set({ [STORAGE_KEY]: notes });
        renderNotes();
      }
    };
  });
}

// Tabs
tabBtns.forEach(btn => {
  btn.onclick = () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderNotes();
  };
});

// Search
searchInput.oninput = () => renderNotes();

// UI Interactions
addBtn.onclick = () => noteModal.classList.add('active');
cancelBtn.onclick = closeModal;

function closeModal() {
  noteModal.classList.remove('active');
  noteTitle.value = '';
  noteContent.value = '';
}

saveBtn.onclick = saveNote;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start
init();
