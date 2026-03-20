// Floating Widget Logic
(function() {
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
  
  container.appendChild(iframe);
  container.appendChild(btn);
  document.body.appendChild(container);

  // Toggle panel
  btn.onclick = () => {
    container.classList.toggle('active');
  };

  // Dragging logic
  let isDragging = false;
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
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === btn || btn.contains(e.target)) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
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
