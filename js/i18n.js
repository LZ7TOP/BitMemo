const I18N_MAP = {
  'zh': window.I18N_ZH,
  'zh_tw': window.I18N_ZH_TW,
  'en': window.I18N_EN,
  'ja': window.I18N_JA,
  'ko': window.I18N_KO
};

let currentLang = 'zh';

async function initI18n() {
  const settings = await chrome.storage.local.get(['quick_notes_settings_lz7']);
  currentLang = settings.quick_notes_settings_lz7?.lang || 'zh';
  applyTranslations();
}

function t(key) {
  const langData = I18N_MAP[currentLang] || I18N_MAP['zh'];
  return langData[key] || key;
}

function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    
    if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
      el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Special cases for dynamic content like type labels in JS
  window.i18n = { t, currentLang };
}

window.initI18n = initI18n;
window.applyTranslations = applyTranslations;
window.setLanguage = async (lang) => {
  currentLang = lang;
  const data = await chrome.storage.local.get(['quick_notes_settings_lz7']);
  const settings = data.quick_notes_settings_lz7 || { showWidget: true };
  settings.lang = lang;
  await chrome.storage.local.set({ ['quick_notes_settings_lz7']: settings });
  applyTranslations();
  
  // Trigger event for other components to update if needed
  window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
};
