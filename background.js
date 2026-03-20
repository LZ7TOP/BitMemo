// Handle link opening from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLink') {
    let url = request.url;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    chrome.tabs.create({ url: url });
  }
});
