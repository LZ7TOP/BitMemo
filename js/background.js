const STORAGE_KEY = 'quick_notes_lz7';
const SETTINGS_KEY = 'quick_notes_settings_lz7';

// Language labels map for context menu & notifications
const I18N_BG = {
  zh: { add: "添加到 像素记", success: "已添加到 像素记" },
  zh_tw: { add: "添加到 像素記", success: "已添加到 像素記" },
  en: { add: "Add to BitMemo", success: "Added to BitMemo" },
  ja: { add: "BitMemo に追加", success: "BitMemo に追加しました" },
  ko: { add: "BitMemo에 추가", success: "BitMemo에 추가되었습니다" }
};

function detectType(content) {
  if (!content) return 'text';
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/.test(content.trim())) return 'link';
  const codePatterns = ['{', '}', ';', 'function', 'const ', 'let ', 'var ', 'import ', 'def ', 'class '];
  if (codePatterns.some(p => content.includes(p))) return 'code';
  return 'text';
}

async function updateContextMenu() {
  const settings = await chrome.storage.local.get(SETTINGS_KEY);
  const lang = (settings[SETTINGS_KEY] && settings[SETTINGS_KEY].lang) || 'zh';
  const label = (I18N_BG[lang] || I18N_BG.zh).add;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "add_to_bitmemo",
      title: label,
      contexts: ["selection", "link"]
    });
  });
}

chrome.runtime.onInstalled.addListener(updateContextMenu);
chrome.runtime.onStartup.addListener(updateContextMenu);

chrome.storage.onChanged.addListener((changes) => {
  if (changes[SETTINGS_KEY]) updateContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add_to_bitmemo") {
    const content = info.selectionText || info.linkUrl;
    if (!content) return;

    const [data, settings] = await Promise.all([
      chrome.storage.local.get(STORAGE_KEY),
      chrome.storage.local.get(SETTINGS_KEY)
    ]);
    
    const notes = data[STORAGE_KEY] || [];
    const lang = (settings[SETTINGS_KEY] && settings[SETTINGS_KEY].lang) || 'zh';
    const successMsg = (I18N_BG[lang] || I18N_BG.zh).success;

    const newNote = {
      id: Date.now().toString(),
      type: detectType(content),
      title: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
      content: content,
      source: 'contextMenu',
      time: new Date().toISOString()
    };

    notes.unshift(newNote);
    await chrome.storage.local.set({ [STORAGE_KEY]: notes });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'showToast', 
      message: successMsg 
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    let url = request.url;
    if (!url.startsWith('http')) url = 'https://' + url;
    chrome.tabs.create({ url: url });
  }
});
