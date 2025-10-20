// ------------------ Tab System ------------------
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      tabContents[index].classList.add("active");
    });
  });
});

// ------------------ Search System ------------------
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");

searchForm.addEventListener("submit", async e => {
  e.preventDefault();
  const query = document.getElementById("query").value.trim();
  if (!query) return;

  resultsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const results = await res.json();

    resultsDiv.innerHTML = results.map(r => `
      <div class="result">
        <a href="${r.url}" target="_blank">${r.title}</a>
        <p>${r.description}</p>
        <button onclick="openProxy('${r.url}')">Open via Proxy</button>
      </div>
    `).join('');
  } catch (err) {
    resultsDiv.innerHTML = `<p>Error loading results: ${err.message}</p>`;
  }
});

// ------------------ Proxy/Open Logic ------------------
function openProxy(url) {
  const dynamicSites = ['coolmathgames.com','class-77.us'];
  const isDynamic = dynamicSites.some(d => url.includes(d));

  if (isDynamic) {
    window.open(url,'_blank'); // dynamic sites open in new tab
  } else {
    window.location.href = `/proxy?url=${encodeURIComponent(url)}`;
  }
}

// ------------------ Optional: Background Animation ------------------
const bg = document.getElementById("background");
if (bg) {
  // Example: simple animated gradient
  let hue = 0;
  setInterval(() => {
    hue = (hue + 1) % 360;
    bg.style.background = `linear-gradient(${hue}deg, #4facfe, #00f2fe)`;
  }, 50);
}
