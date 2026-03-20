// Floating Widget Logic
(function() {
  const SETTINGS_KEY = 'quick_notes_settings_lz7';
  const container = document.createElement('div');
  container.className = 'qn-widget-container';
  
  const iframe = document.createElement('iframe');
  iframe.className = 'qn-panel-iframe';
  iframe.src = chrome.runtime.getURL('popup.html');
  
  const btn = document.createElement('div');
  btn.className = 'qn-floating-btn';
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icons/icon48.png');
  btn.appendChild(icon);
  
  const closeBtn = document.createElement('div');
  closeBtn.className = 'qn-close-btn';
  closeBtn.innerHTML = '×';
  closeBtn.title = '关闭';
  
  container.appendChild(iframe);
  container.appendChild(btn);
  container.appendChild(closeBtn);
  document.body.appendChild(container);

  // Sync visibility with settings
  chrome.storage.local.get(SETTINGS_KEY, (data) => {
    const settings = data[SETTINGS_KEY] || { showWidget: true };
    if (!settings.showWidget) {
      container.classList.add('hidden');
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes[SETTINGS_KEY]) {
      const newValue = changes[SETTINGS_KEY].newValue || { showWidget: true };
      container.classList.toggle('hidden', !newValue.showWidget);
    }
  });

  // Toggle panel (Double Click only)
  btn.addEventListener('dblclick', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Calculate smart positioning before showing
    if (!container.classList.contains('active')) {
      updatePanelPosition();
    }
    
    container.classList.toggle('active');
  });

  function updatePanelPosition() {
    const btnRect = btn.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reset classes
    iframe.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right');
    closeBtn.classList.remove('pos-top-right', 'pos-top-left', 'pos-bottom-right', 'pos-bottom-left');

    let isTop = false;
    let isLeft = false;

    // Vertical position
    if (btnRect.top > viewportHeight / 2) {
      iframe.classList.add('pos-top');
      isTop = true;
    } else {
      iframe.classList.add('pos-bottom');
      isTop = false;
    }

    // Horizontal position
    if (btnRect.left > viewportWidth / 2) {
      iframe.classList.add('pos-left');
      isLeft = true;
    } else {
      iframe.classList.add('pos-right');
      isLeft = false;
    }

    // Position close button at the corner furthest from the floating button
    if (isTop && isLeft) closeBtn.classList.add('pos-top-left');
    else if (isTop && !isLeft) closeBtn.classList.add('pos-top-right');
    else if (!isTop && isLeft) closeBtn.classList.add('pos-bottom-left');
    else closeBtn.classList.add('pos-bottom-right');
  }

  // Close button logic
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.remove('active');
  });

  // Dragging logic
  let isDragging = false;
  let hasDragged = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  btn.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    hasDragged = false;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === btn || btn.contains(e.target)) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      hasDragged = true;
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, container);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  function dragEnd() {
    isDragging = false;
  }
})();
