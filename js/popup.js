// Storage key
const STORAGE_KEY = 'quick_notes_lz7';
const SETTINGS_KEY = 'quick_notes_settings_lz7';

// Icons
const LINK_ICON_SVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
const PIN_ICON_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><path d="M12 2v8M5 10h14M19 10l-2 5H7l-2-5M12 15v7"/></svg>`;

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
const editorWrapper = document.getElementById('editorWrapper');
const lineNumbers = document.getElementById('lineNumbers');

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

const codeLangGroup = document.getElementById('codeLangGroup');
const customCodeLangSelect = document.getElementById('customCodeLangSelect');
const codeLangTrigger = customCodeLangSelect.querySelector('.select-trigger');
const selectedCodeLangText = document.getElementById('selectedCodeLangText');
const codeLangOptions = customCodeLangSelect.querySelectorAll('.select-option');
const codeLangInput = document.getElementById('codeLang');

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
  initDragAndDrop();
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

  // Sort notes: pinned ones first, and maintain original stable indexing order
  const notesWithIndex = filteredNotes.map((note, index) => ({ note, index }));
  notesWithIndex.sort((a, b) => {
    const aPinned = a.note.pinned ? 1 : 0;
    const bPinned = b.note.pinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return a.index - b.index;
  });
  const sortedNotes = notesWithIndex.map(item => item.note);

  notesList.innerHTML = sortedNotes.length > 0 
    ? sortedNotes.map(note => createNoteCard(note)).join('')
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
    displayContent = `<a href="${escapeHtml(url)}" target="_blank" class="note-content-link">${LINK_ICON_SVG}${escapeHtml(note.content)}</a>`;
  } else if (note.type === 'text') {
    displayContent = linkify(escapeHtml(note.content));
  }

  const isPinned = !!note.pinned;
  const pinIndicator = isPinned ? `<span class="pin-indicator">${PIN_ICON_SVG}${window.i18n.t('btn_pin')}</span>` : '';
  const formattedTime = formatTime(note.timestamp || note.time || new Date().toISOString());
  const typeLabelText = (note.type === 'code' && note.codeLang) ? note.codeLang : typeLabels[note.type];

  return `
    <div class="note-card${isPinned ? ' pinned' : ''}" data-id="${note.id}" draggable="true">
      <div class="note-header">
        <div class="note-title">${pinIndicator}${note.title || (note.type === 'link' ? window.i18n.t('modal_title_add') : window.i18n.t('tab_text'))}</div>
        <div class="note-type-icon ${note.type}">${typeLabelText}</div>
      </div>
      <div class="${contentClass}">${displayContent}</div>
      <div class="note-footer">
        <div class="note-time">${formattedTime}</div>
        <div class="card-actions">
          <button class="action-btn pin-toggle${isPinned ? ' active' : ''}" data-id="${note.id}">
            ${isPinned ? window.i18n.t('btn_unpin') : window.i18n.t('btn_pin')}
          </button>
          ${note.type === 'link' ? `<button class="action-btn open-link" data-url="${escapeHtml(note.content)}">${window.i18n.t('btn_open')}</button>` : ''}
          ${note.type === 'code' ? `<button class="action-btn format" data-id="${note.id}">${window.i18n.t('btn_format')}</button>` : ''}
          <button class="action-btn edit" data-id="${note.id}">${window.i18n.t('btn_edit')}</button>
          <button class="action-btn copy" data-id="${note.id}">${window.i18n.t('btn_copy')}</button>
          <button class="action-btn delete" data-id="${note.id}">${window.i18n.t('btn_delete')}</button>
        </div>
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
    newNote.codeLang = codeLangInput.value;
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

  document.querySelectorAll('.action-btn.pin-toggle').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const note = notes.find(n => n.id === id);
      if (note) {
        note.pinned = !note.pinned;
        await chrome.storage.local.set({ [STORAGE_KEY]: notes });
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
  editingId = null;
  modalTitle.textContent = window.i18n.t('modal_title_add');
  updateSelectedType('text'); // Reset to default
  customTypeSelect.classList.remove('active');
  customCodeLangSelect.classList.remove('active');
  updateSelectedCodeLang('JavaScript');
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
    opt.classList.toggle('active', opt.dataset.value === value);
  });

  if (value === 'code') {
    codeLangGroup.style.display = 'block';
    editorWrapper.classList.add('code-mode');
    updateLineNumbers();
  } else {
    codeLangGroup.style.display = 'none';
    editorWrapper.classList.remove('code-mode');
    lineNumbers.innerHTML = '';
  }
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
  customCodeLangSelect.classList.remove('active');
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

// Custom Code Language Selector Interaction
codeLangTrigger.onclick = (e) => {
  e.stopPropagation();
  customCodeLangSelect.classList.toggle('active');
  customTypeSelect.classList.remove('active');
  langSelector.classList.remove('active');
};

codeLangOptions.forEach(opt => {
  opt.onclick = (e) => {
    e.stopPropagation();
    updateSelectedCodeLang(opt.dataset.value);
    customCodeLangSelect.classList.remove('active');
  };
});

function updateSelectedCodeLang(value) {
  codeLangInput.value = value;
  selectedCodeLangText.textContent = value;
  codeLangOptions.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === value);
  });
}

document.addEventListener('click', () => {
  customTypeSelect.classList.remove('active');
  customCodeLangSelect.classList.remove('active');
  langSelector.classList.remove('active');
});

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editingId = id;
  modalTitle.textContent = window.i18n.t('modal_title_edit');
  updateSelectedType(note.type);
  if (note.type === 'code') {
    updateSelectedCodeLang(note.codeLang || 'JavaScript');
  }
  noteTitle.value = note.title;
  noteContent.value = note.content;
  noteModal.classList.add('active');
  isTypeManuallySelected = false; // Allow type detection upon user edit
  updateLineNumbers();
}

saveBtn.onclick = saveNote;

// Bind noteContent input event for automatic type detection and line numbers update
noteContent.oninput = () => {
  if (!isTypeManuallySelected) {
    const content = noteContent.value.trim();
    const type = detectType(content);
    updateSelectedType(type);
  }
  updateLineNumbers();
};

// Sync scroll between noteContent and lineNumbers
noteContent.onscroll = () => {
  lineNumbers.scrollTop = noteContent.scrollTop;
};

// Editor advanced features: Tab indent and auto-indent inherit
noteContent.onkeydown = (e) => {
  if (noteType.value !== 'code') return;

  if (e.key === 'Tab') {
    e.preventDefault();
    const start = noteContent.selectionStart;
    const end = noteContent.selectionEnd;
    const val = noteContent.value;
    noteContent.value = val.substring(0, start) + "  " + val.substring(end);
    noteContent.selectionStart = noteContent.selectionEnd = start + 2;
    updateLineNumbers();
  } else if (e.key === 'Enter') {
    const start = noteContent.selectionStart;
    const val = noteContent.value;
    const lastNewLine = val.lastIndexOf('\n', start - 1);
    const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
    const currentLine = val.substring(lineStart, start);
    const indentMatch = currentLine.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    
    if (indent.length > 0) {
      e.preventDefault();
      noteContent.value = val.substring(0, start) + "\n" + indent + val.substring(start);
      noteContent.selectionStart = noteContent.selectionEnd = start + 1 + indent.length;
      updateLineNumbers();
    }
  }
};

function updateLineNumbers() {
  if (noteType.value !== 'code') return;
  const lines = noteContent.value.split('\n');
  const count = Math.max(1, lines.length);
  let numbersHtml = '';
  for (let i = 1; i <= count; i++) {
    numbersHtml += `<div>${i}</div>`;
  }
  lineNumbers.innerHTML = numbersHtml;
  lineNumbers.scrollTop = noteContent.scrollTop;
}

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
    return `<a href="${url}" target="_blank" class="text-link">${LINK_ICON_SVG}${url}</a>`;
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

// Helper: Format time to YY-MM-DD HH:mm
function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    const YY = String(date.getFullYear()).slice(-2);
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${YY}-${MM}-${DD} ${hh}:${mm}`;
  } catch (e) {
    return '';
  }
}

// Drag & Drop reordering support
let dragSrcEl = null;

function initDragAndDrop() {
  notesList.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.note-card');
    if (!card) return;
    dragSrcEl = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.id);
  });

  notesList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.note-card');
    if (!card || card === dragSrcEl) return;
    
    card.classList.add('drag-over');
  });

  notesList.addEventListener('dragleave', (e) => {
    const card = e.target.closest('.note-card');
    if (card) card.classList.remove('drag-over');
  });

  notesList.addEventListener('drop', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const card = e.target.closest('.note-card');
    if (!card) return;
    card.classList.remove('drag-over');

    const srcId = e.dataTransfer.getData('text/plain');
    const targetId = card.dataset.id;
    if (srcId === targetId) return;

    const srcIndex = notes.findIndex(n => n.id === srcId);
    const targetIndex = notes.findIndex(n => n.id === targetId);

    if (srcIndex !== -1 && targetIndex !== -1) {
      const [movedNote] = notes.splice(srcIndex, 1);
      const targetNote = notes[targetIndex];
      
      // Auto-sync pinned attribute if dragged into different zone
      if (movedNote.pinned !== targetNote.pinned) {
        movedNote.pinned = targetNote.pinned;
      }

      notes.splice(targetIndex, 0, movedNote);

      await chrome.storage.local.set({ [STORAGE_KEY]: notes });
      renderNotes();
    }
  });

  notesList.addEventListener('dragend', (e) => {
    const card = e.target.closest('.note-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('drag-over'));
  });
}
