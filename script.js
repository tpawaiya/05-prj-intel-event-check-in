
const GOAL = 50; 

const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");

const greeting = document.getElementById("greeting");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");

const waterCountEl = document.getElementById("waterCount");
const zeroCountEl = document.getElementById("zeroCount");
const powerCountEl = document.getElementById("powerCount");


const teamStats = document.querySelector(".team-stats");
const listSection = document.createElement("div");
listSection.id = "attendeeListSection";
listSection.style.marginTop = "24px";
listSection.innerHTML = `
  <h3 style="color:#64748b;font-size:16px;margin-bottom:12px;">Attendee List</h3>
  <div id="attendeeList" style="
    text-align:left;background:#f8fafc;border-radius:12px;padding:16px;
    border:1px solid #f1f5f9; max-height:300px; overflow:auto;">
    <p style="color:#64748b;">No attendees yet.</p>
  </div>
`;
teamStats.appendChild(listSection);
const attendeeListEl = document.getElementById("attendeeList");


const STORAGE_KEY = "intelSummitCheckIn_v1";

let state = {
  total: 0,
  teams: {
    water: 0, 
    zero: 0,  
    power: 0  
  },
  attendees: [] 
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
   
    if (
      typeof parsed?.total === "number" &&
      parsed?.teams && ["water","zero","power"].every(k => typeof parsed.teams[k] === "number") &&
      Array.isArray(parsed?.attendees)
    ) {
      state = parsed;
    }
  } catch (e) {
    console.warn("Could not load saved state:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save state:", e);
  }
}


const TEAM_LABELS = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables"
};

function titleCase(str) {
  return str
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

function updateProgress() {
  const pct = Math.min(100, (state.total / GOAL) * 100);
  progressBar.style.width = `${pct}%`;
}

function renderCounts() {
  attendeeCountEl.textContent = state.total;
  waterCountEl.textContent = state.teams.water;
  zeroCountEl.textContent = state.teams.zero;
  powerCountEl.textContent = state.teams.power;
  updateProgress();
}

function renderAttendeeList() {
  if (state.attendees.length === 0) {
    attendeeListEl.innerHTML = `<p style="color:#64748b;">No attendees yet.</p>`;
    return;
  }
  
  const rows = state.attendees
    .map(({ name, team }) => {
      const teamName = TEAM_LABELS[team] || "—";
      return `
        <div style="
          display:flex;justify-content:space-between;align-items:center;
          padding:8px 10px;border-bottom:1px solid #e2e8f0;">
          <span style="font-weight:600;color:#1f2937;">${name}</span>
          <span style="font-size:14px;color:#475569;">${teamName}</span>
        </div>`;
    })
    .join("");
  attendeeListEl.innerHTML = rows;
}

function showGreeting(message, ok = true) {
  greeting.textContent = message;
  greeting.classList.toggle("success-message", ok);
  greeting.style.display = "block";

  
  clearTimeout(showGreeting._t);
  showGreeting._t = setTimeout(() => {
    greeting.style.display = "none";
  }, 3000);
}

function celebrateIfGoalReached() {
  if (state.total !== GOAL) return;

  
  const entries = Object.entries(state.teams); 
  entries.sort((a, b) => b[1] - a[1]);
  const [winnerKey, winCount] = entries[0];
  const topTied = entries.filter(([, c]) => c === winCount).map(([k]) => k);

  let winnerText;
  if (topTied.length > 1) {
    // Tie
    winnerText = `It's a tie between ${topTied.map(k => TEAM_LABELS[k]).join(" & ")}!`;
  } else {
    winnerText = `${TEAM_LABELS[winnerKey]} wins with ${winCount} check-ins!`;
  }

  
  const banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.style.cssText = `
    position: fixed; left: 50%; transform: translateX(-50%);
    bottom: 24px; z-index: 9999;
    background: linear-gradient(90deg,#0071c5,#00aeef);
    color: #fff; padding: 14px 22px; border-radius: 12px;
    box-shadow: 0 10px 24px rgba(0,0,0,.18); font-weight:700;
  `;
  banner.textContent = `🎉 Attendance goal reached! ${winnerText}`;
  document.body.appendChild(banner);

  setTimeout(() => banner.remove(), 5000);
}


function renderAll() {
  renderCounts();
  renderAttendeeList();
}


form.addEventListener("submit", (e) => {
  e.preventDefault();

  const rawName = nameInput.value;
  const team = teamSelect.value;

  if (!rawName || !team) {
    showGreeting("Please enter a name and select a team.", false);
    return;
  }

  const name = titleCase(rawName);

  
  const isDuplicate = state.attendees.some(a => a.name === name);
  if (isDuplicate) {
    showGreeting(`${name} is already checked in.`, false);
    return;
  }

  state.total += 1;
  if (state.teams[team] != null) state.teams[team] += 1;
  state.attendees.push({ name, team });

  
  saveState();
  renderAll();

  
  showGreeting(`Welcome, ${name}! Checked in to ${TEAM_LABELS[team]}.`, true);

  
  form.reset();
  nameInput.focus();

  
  celebrateIfGoalReached();
});


nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    teamSelect.focus();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderAll();
  updateProgress(); 
});
