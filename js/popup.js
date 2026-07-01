// Storage key
const STORAGE_KEY = 'quick_notes_lz7';
const SETTINGS_KEY = 'quick_notes_settings_lz7';

// State
let notes = [];
let currentTab = 'all';
let editingId = null;
let isTypeManuallySelected = false;

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
const clearAllBtn = document.getElementById('clearAllBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmClearBtn = document.getElementById('confirmClearBtn');
const cancelClearBtn = document.getElementById('cancelClearBtn');

// Custom Select Elements
const customTypeSelect = document.getElementById('customTypeSelect');
const selectTrigger = customTypeSelect.querySelector('.select-trigger');
const selectedTypeText = document.getElementById('selectedTypeText');
const selectOptions = customTypeSelect.querySelectorAll('.select-option');

// Language Selector Elements
const langSelector = document.getElementById('langSelector');
const langOptions = document.querySelectorAll('.lang-option');

// Initialize
async function init() {
  await initI18n();
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
    : `<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">${window.i18n.t('no_data')}</div>`;

  // Attach event listeners to dynamic elements
  attachCardEvents();
}

function createNoteCard(note) {
  const typeLabels = { 
    text: window.i18n.t('tab_text'), 
    link: window.i18n.t('tab_link'), 
    code: window.i18n.t('tab_code') 
  };
  const contentClass = note.type === 'code' ? 'note-content code' : 'note-content';
  
  let displayContent = escapeHtml(note.content);
  if (note.type === 'link') {
    let url = note.content;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    displayContent = `<a href="${escapeHtml(url)}" target="_blank" class="note-content-link">🔗 ${escapeHtml(note.content)}</a>`;
  } else if (note.type === 'text') {
    displayContent = linkify(escapeHtml(note.content));
  }

  return `
    <div class="note-card" data-id="${note.id}">
      <div class="note-header">
        <div class="note-title">${note.title || (note.type === 'link' ? window.i18n.t('modal_title_add') : window.i18n.t('tab_text'))}</div>
        <div class="note-type-icon">${typeLabels[note.type]}</div>
      </div>
      <div class="${contentClass}">${displayContent}</div>
      <div class="card-actions">
        ${note.type === 'link' ? `<button class="action-btn open-link" data-url="${escapeHtml(note.content)}">${window.i18n.t('btn_open')}</button>` : ''}
        ${note.type === 'code' ? `<button class="action-btn format" data-id="${note.id}">${window.i18n.t('btn_format')}</button>` : ''}
        <button class="action-btn edit" data-id="${note.id}">${window.i18n.t('btn_edit')}</button>
        <button class="action-btn copy" data-id="${note.id}">${window.i18n.t('btn_copy')}</button>
        <button class="action-btn delete" data-id="${note.id}">${window.i18n.t('btn_delete')}</button>
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

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(window.i18n.t('copy_success'));
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

// Clear All Logic
clearAllBtn.onclick = () => {
  confirmModal.classList.add('active');
};

cancelClearBtn.onclick = () => {
  confirmModal.classList.remove('active');
};

confirmClearBtn.onclick = async () => {
  notes = [];
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  confirmModal.classList.remove('active');
  renderNotes();
};

function copyNote(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    copyToClipboard(note.content);
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
  modalTitle.textContent = window.i18n.t('modal_title_add');
  updateSelectedType('text'); // Reset to default
  customTypeSelect.classList.remove('active');
  isTypeManuallySelected = false;
}

function updateSelectedType(value) {
  noteType.value = value;
  const labels = { 
    text: window.i18n.t('type_text'), 
    link: window.i18n.t('type_link'), 
    code: window.i18n.t('type_code') 
  };
  selectedTypeText.textContent = labels[value];
  
  selectOptions.forEach(opt => {
    if (opt.dataset.value === value) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

// Language Selector Logic
langSelector.onclick = (e) => {
  e.stopPropagation();
  langSelector.classList.toggle('active');
  customTypeSelect.classList.remove('active'); // Close other dropdowns
};

langOptions.forEach(opt => {
  opt.onclick = (e) => {
    e.stopPropagation();
    window.setLanguage(opt.dataset.lang);
    langSelector.classList.remove('active');
  };
});

window.addEventListener('langChanged', () => {
  renderNotes(); // Re-render to update dynamic labels
});

// Custom Select Interaction
selectTrigger.onclick = (e) => {
  e.stopPropagation();
  customTypeSelect.classList.toggle('active');
  langSelector.classList.remove('active'); // Close other dropdowns
};

selectOptions.forEach(opt => {
  opt.onclick = (e) => {
    e.stopPropagation();
    updateSelectedType(opt.dataset.value);
    customTypeSelect.classList.remove('active');
    isTypeManuallySelected = true;
  };
});

document.addEventListener('click', () => {
  customTypeSelect.classList.remove('active');
  langSelector.classList.remove('active');
});

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editingId = id;
  modalTitle.textContent = window.i18n.t('modal_title_edit');
  updateSelectedType(note.type);
  noteTitle.value = note.title;
  noteContent.value = note.content;
  noteModal.classList.add('active');
  isTypeManuallySelected = false; // Allow type detection upon user edit
}

saveBtn.onclick = saveNote;

// Bind noteContent input event for automatic type detection
noteContent.oninput = () => {
  if (!isTypeManuallySelected) {
    const content = noteContent.value.trim();
    const type = detectType(content);
    updateSelectedType(type);
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Automatically detect the type of note content
function detectType(content) {
  if (!content) return 'text';

  // Check if content matches URL format
  const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
  if (urlPattern.test(content)) {
    return 'link';
  }

  // Check if content is code
  const lines = content.split('\n');
  const codeIndicators = [
    /function\s+\w*\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|import\s+.*\s+from|class\s+\w+|def\s+\w+\(.*\):/,
    /console\.log\(|System\.out\.println\(|print\(.*\)/,
    /<\/?[a-z][\s\S]*>/i, // HTML/XML tags
    /\{[\s\S]*\}/, // Braces
    /^\s*(if|for|while|switch|return)\b/m,
    /;\s*$/m // Semicolon ending lines
  ];

  let score = 0;
  if (lines.length > 1) {
    const hasIndent = lines.some(line => line.startsWith('  ') || line.startsWith('\t'));
    if (hasIndent) score += 2;
  }

  for (const regex of codeIndicators) {
    if (regex.test(content)) {
      score += 2;
    }
  }

  if (score >= 2) {
    return 'code';
  }

  return 'text';
}

// Convert plain URLs inside text to clickable links
function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" class="text-link">🔗 ${url}</a>`;
  });
}

// Settings
showWidgetToggle.onchange = async () => {
  await chrome.storage.local.set({ 
    [SETTINGS_KEY]: { showWidget: showWidgetToggle.checked } 
  });
};

// Sync Logic: Listen for storage changes to sync across popup and floating panel
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes[STORAGE_KEY]) {
      notes = changes[STORAGE_KEY].newValue || [];
      renderNotes();
    }
    if (changes[SETTINGS_KEY]) {
      const settings = changes[SETTINGS_KEY].newValue || { showWidget: true };
      showWidgetToggle.checked = settings.showWidget;
    }
  }
});

// Start
init();
