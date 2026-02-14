function getUser(){ return localStorage.getItem("nr_user"); }
function logout(){
  localStorage.removeItem("nr_user");
  location.href = "/signup";
}

let servers = JSON.parse(localStorage.getItem("nr_servers") || "[]");
let current = null;

const serversEl = document.getElementById("servers");
const contentEl = document.getElementById("content");
const promptEl = document.getElementById("prompt");

const UIPrompts=[];
["Preparing NetherRealms…","Loading UI…","Syncing state…","Console ready…","Server queued…","Stock enforced…"]
  .forEach(t => { for(let i=1;i<=80;i++) UIPrompts.push(`${t} (${i})`); });
while(UIPrompts.length<520) UIPrompts.push(`System message #${UIPrompts.length}`);
setInterval(()=> promptEl.textContent = UIPrompts[Math.floor(Math.random()*UIPrompts.length)], 2200);

function saveServers(){ localStorage.setItem("nr_servers", JSON.stringify(servers)); }

function renderServers(){
  serversEl.innerHTML = "";
  servers.forEach((s, i) => {
    const d = document.createElement("div");
    d.className = "server " + (s.status === "Online" ? "online" : "");
    d.innerHTML = `<b>${escapeHtml(s.name)}</b><br><small>${escapeHtml(s.address)}</small>`;
    d.onclick = () => openServer(i);
    serversEl.appendChild(d);
  });
  saveServers();
}

function dashboard(){
  current = null;
  contentEl.innerHTML = `
    <h2>Dashboard</h2>
    <p class="sub">Welcome <span class="badge">${escapeHtml(getUser()||"")}</span></p>
    <div class="panel">Select a server on the left or create a new one.</div>
  `;
}

function createServer(){
  if(servers.length >= 3) return alert("Max 3 servers");
  const name = prompt("Server name");
  const address = prompt("Server address");
  if(!name || !address) return;
  servers.push({ name, address, status:"Queued", players:[] });
  renderServers();
  dashboard();
}

function openServer(i){
  current = i;
  const s = servers[i];
  contentEl.innerHTML = `
    <div class="topbar">
      <div>
        <h2 style="margin:0">${escapeHtml(s.name)}</h2>
        <div class="sub">Status: <span class="status">${escapeHtml(s.status)}</span></div>
      </div>
      <div class="row" style="max-width:360px">
        <button class="btn" onclick="copyAddr()">Copy Address</button>
        <button class="btn" onclick="logout()">Logout</button>
      </div>
    </div>

    <div class="row">
      <div class="tab" onclick="consoleTab()">Console</div>
      <div class="tab" onclick="playersTab()">Players</div>
      <div class="tab" onclick="settingsTab()">Settings</div>
    </div>

    <div id="panel" style="margin-top:12px"></div>
  `;
  consoleTab();
}

function copyAddr(){ navigator.clipboard.writeText(servers[current].address); }

function consoleTab(){
  document.getElementById("panel").innerHTML = `
    <div class="panel">
      <textarea id="cmd" class="input" style="min-height:100px" placeholder="/op Steve"></textarea>
      <button class="btn" onclick="sendCmd()">Send</button>
    </div>
  `;
}
function sendCmd(){
  const cmd = document.getElementById("cmd").value.trim();
  if(!cmd) return;
  document.getElementById("cmd").value = "";
  alert("UI-only: command recorded (no backend yet).");
}

function playersTab(){
  const s = servers[current];
  let html = "";
  (s.players || []).forEach(p => {
    html += `<div class="panel" style="margin-bottom:10px"><b>${escapeHtml(p)}</b></div>`;
  });
  document.getElementById("panel").innerHTML = `<div class="panel">${html || "No players"}</div>`;
}

function settingsTab(){
  document.getElementById("panel").innerHTML = `
    <div class="panel">
      <div class="row">
        <button class="btn" onclick="setOnline()">Mark Online</button>
        <button class="btn" onclick="deleteServer()">Delete Server</button>
      </div>
    </div>
  `;
}
function setOnline(){
  servers[current].status = "Online";
  renderServers();
  openServer(current);
}
function deleteServer(){
  if(!confirm("Are you sure?")) return;
  servers.splice(current, 1);
  renderServers();
  dashboard();
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

(function(){
  if(!getUser()) location.href = "/signup";
  renderServers();
  dashboard();
})();
