// client.js - tab and iframe management for Seb's Unblocker V7

let tabCount = 0;
const tabBar = document.getElementById('tabBar');
const tabContainer = document.getElementById('tabContainer');

/**
 * Create the initial Home tab (the search form)
 */
function createHomeTab() {
  tabCount++;
  const tabId = 'tab' + tabCount;

  // create tab button
  const tabButton = document.createElement('div');
  tabButton.classList.add('tab', 'active');
  tabButton.id = tabId + '-btn';
  tabButton.innerText = "Home";
  tabButton.addEventListener('click', ()=>activateTab(tabId));

  // close button
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('closeTab');
  closeBtn.innerText = 'x';
  closeBtn.onclick = (e)=>{ e.stopPropagation(); closeTab(tabId); };
  tabButton.appendChild(closeBtn);

  tabBar.insertBefore(tabButton, document.getElementById('newTabBtn'));

  // content
  const tabContent = document.createElement('div');
  tabContent.classList.add('tabContent','active');
  tabContent.id = tabId;

  tabContent.innerHTML = `
    <h1 class="glow-text" style="text-align:center; margin-top:20px;">Seb's Unblocker<sup>V7</sup></h1>
    <div class="search-container">
      <input type="text" placeholder="Enter website URL..." class="urlInput">
      <button class="goBtn">Go</button>
    </div>
  `;
  tabContainer.appendChild(tabContent);

  // wiring
  const goBtn = tabContent.querySelector('.goBtn');
  const urlInput = tabContent.querySelector('.urlInput');
  goBtn.addEventListener('click', ()=> {
    let url = urlInput.value.trim();
    if(!url) return;
    if(!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    createWebTab(url);
  });
  urlInput.addEventListener('keypress', e => { if(e.key === 'Enter') { e.preventDefault(); goBtn.click(); } });

  activateTab(tabId);
}

/**
 * Create a web tab with an iframe pointing to /proxy?url=...
 */
function createWebTab(url) {
  tabCount++;
  const tabId = 'tab' + tabCount;

  // tab button
  const tabButton = document.createElement('div');
  tabButton.classList.add('tab', 'active');
  tabButton.id = tabId + '-btn';
  // display short label (strip protocol to keep UI tidy)
  const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  tabButton.innerText = label;
  tabButton.addEventListener('click', ()=>activateTab(tabId));

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('closeTab');
  closeBtn.innerText = 'x';
  closeBtn.onclick = (e)=>{ e.stopPropagation(); closeTab(tabId); };
  tabButton.appendChild(closeBtn);

  tabBar.insertBefore(tabButton, document.getElementById('newTabBtn'));

  // content
  const tabContent = document.createElement('div');
  tabContent.classList.add('tabContent','active');
  tabContent.id = tabId;

  // Use iframe, set sandbox minimally to allow scripts but keep some isolation.
  // Note: sandbox restrictions may prevent some sites from fully working; we avoid sandbox attribute for compatibility.
  tabContent.innerHTML = `<iframe src="/proxy?url=${encodeURIComponent(url)}"></iframe>`;

  tabContainer.appendChild(tabContent);
  activateTab(tabId);
}

/**
 * Activate tab by id
 */
function activateTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tabContent').forEach(tc => tc.classList.remove('active'));
  const btn = document.getElementById(tabId + '-btn');
  const content = document.getElementById(tabId);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

/**
 * Close a tab and activate last tab if exists
 */
function closeTab(tabId) {
  const btn = document.getElementById(tabId + '-btn');
  const content = document.getElementById(tabId);
  if (btn) btn.remove();
  if (content) content.remove();

  const tabs = document.querySelectorAll('.tab');
  if (tabs.length > 0) {
    const lastTabId = tabs[tabs.length-1].id.replace('-btn','');
    activateTab(lastTabId);
  } else {
    // if no tabs left create a home tab
    createHomeTab();
  }
}

// new tab button
document.getElementById('newTabBtn').addEventListener('click', createHomeTab);

// initial home
createHomeTab();
