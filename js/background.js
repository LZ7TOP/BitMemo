const STORAGE_KEY = 'quick_notes_lz7';
const SETTINGS_KEY = 'quick_notes_settings_lz7';

// Language labels map for context menu (static fallback)
const MENU_LABELS = {
  zh: "添加到 像素记",
  zh_tw: "添加到 像素記",
  en: "Add to BitMemo",
  ja: "BitMemo に追加",
  ko: "BitMemo에 추가"
};

function detectType(content) {
  if (!content) return 'text';
  // URL detection
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/.test(content.trim())) return 'link';
  
  // Simple code detection
  const codePatterns = [
    '{', '}', ';', 'function', 'const ', 'let ', 'var ', 'import ', 
    'def ', 'class ', 'if (', 'for (', 'while (', '=>', 'console.log'
  ];
  if (codePatterns.some(p => content.includes(p))) return 'code';
  
  return 'text';
}

// Handle menu creation
async function updateContextMenu() {
  const settings = await chrome.storage.local.get(SETTINGS_KEY);
  const lang = (settings[SETTINGS_KEY] && settings[SETTINGS_KEY].lang) || 'zh';
  const label = MENU_LABELS[lang] || MENU_LABELS.zh;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "add_to_bitmemo",
      title: label,
      contexts: ["selection", "link"]
    });
  });
}

// Initial creation
chrome.runtime.onInstalled.addListener(updateContextMenu);
chrome.runtime.onStartup.addListener(updateContextMenu);

// Listen for storage changes (language change)
chrome.storage.onChanged.addListener((changes) => {
  if (changes[SETTINGS_KEY]) {
    updateContextMenu();
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add_to_bitmemo") {
    const content = info.selectionText || info.linkUrl;
    if (!content) return;

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const notes = data[STORAGE_KEY] || [];
    
    // Auto-detect type
    const type = detectType(content);

    const newNote = {
      id: Date.now().toString(),
      type: type,
      title: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
      content: content,
      source: 'contextMenu',
      time: new Date().toISOString()
    };

    notes.unshift(newNote);
    await chrome.storage.local.set({ [STORAGE_KEY]: notes });
    
    // Notify user in content script
    chrome.tabs.sendMessage(tab.id, { 
      action: 'showToast', 
      message: 'Added to BitMemo / 已添加到像素记' 
    });
  }
});

// Handle link opening
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    let url = request.url;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    chrome.tabs.create({ url: url });
  }
});
