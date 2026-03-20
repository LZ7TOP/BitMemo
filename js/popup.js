// Storage key
const STORAGE_KEY = 'quick_notes_lz7';
const SETTINGS_KEY = 'quick_notes_settings_lz7';

// State
let notes = [];
let currentTab = 'all';
let editingId = null;

// DOM Elements
const notesList = document.getElementById('notesList');
const searchInput = document.getElementById('searchInput');
const tabBtns = document.querySelectorAll('.tab-btn');
const addBtn = document.getElementById('addBtn');
const noteModal = document.getElementById('noteModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const modalTitle = document.getElementById('modalTitle');

const noteType = document.getElementById('noteType');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const showWidgetToggle = document.getElementById('showWidgetToggle');

// Custom Select Elements
const customTypeSelect = document.getElementById('customTypeSelect');
const selectTrigger = customTypeSelect.querySelector('.select-trigger');
const selectedTypeText = document.getElementById('selectedTypeText');
const selectOptions = customTypeSelect.querySelectorAll('.select-option');

// Initialize
async function init() {
  const data = await chrome.storage.local.get([STORAGE_KEY, SETTINGS_KEY]);
  notes = data[STORAGE_KEY] || [];
  
  // Load settings
  const settings = data[SETTINGS_KEY] || { showWidget: true };
  showWidgetToggle.checked = settings.showWidget;
  
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
        ${note.type === 'link' ? `<button class="action-btn open-link" data-url="${escapeHtml(note.content)}">打开</button>` : ''}
        ${note.type === 'code' ? `<button class="action-btn format" data-id="${note.id}">格式化</button>` : ''}
        <button class="action-btn edit" data-id="${note.id}">编辑</button>
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
    title: noteTitle.value.trim() || (noteType.value === 'link' ? '未命名链接' : '便签'),
    content: noteContent.value.trim(),
    timestamp: new Date().toISOString()
  };

  if (!newNote.content) return;

  if (newNote.type === 'code') {
    newNote.content = formatCode(newNote.content);
  }

  if (editingId) {
    const index = notes.findIndex(n => n.id === editingId);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...newNote, id: editingId };
    }
    editingId = null;
  } else {
    notes.unshift(newNote);
  }

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

  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      editNote(btn.dataset.id);
    };
  });

  document.querySelectorAll('.action-btn.open-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'openLink', url: btn.dataset.url });
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
  editingId = null;
  modalTitle.textContent = '新建便签';
  updateSelectedType('text'); // Reset to default
  customTypeSelect.classList.remove('active');
}

function updateSelectedType(value) {
  noteType.value = value;
  const labels = { text: '纯文本', link: '网页链接', code: '代码片段' };
  selectedTypeText.textContent = labels[value];
  
  selectOptions.forEach(opt => {
    if (opt.dataset.value === value) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

// Custom Select Interaction
selectTrigger.onclick = (e) => {
  e.stopPropagation();
  customTypeSelect.classList.toggle('active');
};

selectOptions.forEach(opt => {
  opt.onclick = (e) => {
    e.stopPropagation();
    updateSelectedType(opt.dataset.value);
    customTypeSelect.classList.remove('active');
  };
});

document.addEventListener('click', () => {
  customTypeSelect.classList.remove('active');
});

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editingId = id;
  modalTitle.textContent = '编辑便签';
  updateSelectedType(note.type);
  noteTitle.value = note.title;
  noteContent.value = note.content;
  noteModal.classList.add('active');
}

saveBtn.onclick = saveNote;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Settings
showWidgetToggle.onchange = async () => {
  await chrome.storage.local.set({ 
    [SETTINGS_KEY]: { showWidget: showWidgetToggle.checked } 
  });
};

// Start
init();
