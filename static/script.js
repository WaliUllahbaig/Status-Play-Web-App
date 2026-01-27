const API_BASE = '/api';
const REFRESH_RATE = 3000;

// State
let currentUser = localStorage.getItem('padel_username') || null;
let currentData = null;
let pollInterval = null;
let charts = {};
let currentView = 'dashboard';

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    dashboard: document.getElementById('app-view')
};

const dom = {
    usernameInput: document.getElementById('username-input'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userDisplayName: document.getElementById('user-display-name'),

    // Stats
    totalPlayersVal: document.getElementById('total-players-val'),
    weatherTemp: document.getElementById('weather-temp-val'),
    weatherCond: document.getElementById('weather-cond-val'),
    nextMatchTime: document.getElementById('next-match-time'),
    nextMatchTeams: document.getElementById('next-match-teams'),

    // Lists
    motmName: document.getElementById('motm-name'),
    motmPoints: document.getElementById('motm-points'),
    discountBanner: document.getElementById('discount-banner'),
    waitCount: document.getElementById('wait-count'),
    rosterList: document.getElementById('roster-list'),

    // Buttons
    btnIn: document.getElementById('btn-in'),
    btnOut: document.getElementById('btn-out')
};

// Init
function init() {
    setupSidebar();
    if (currentUser) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Sidebar Logic
function setupSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Logout special case
            if (e.target.id === 'logout-btn' || e.target.parentElement.id === 'logout-btn') {
                logout();
                return;
            }

            // Normalize target (handle icon clicks)
            const targetEl = e.target.classList.contains('nav-item') ? e.target : e.target.parentElement;
            const viewId = targetEl.dataset.view;
            if (viewId) {
                switchView(viewId);
                // Visual Toggle
                navItems.forEach(n => n.classList.remove('active'));
                targetEl.classList.add('active');
            }
        });
    });
}

function switchView(viewId) {
    currentView = viewId;
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // Update Title
    const titles = {
        'dashboard': 'Dashboard Preview',
        'my-team': 'My Squad',
        'courts': 'Court Status',
        'tournaments': 'Tournaments',
        'settings': 'Settings'
    };
    document.getElementById('page-title').innerText = titles[viewId] || 'StatusPlay';

    // Trigger specific render if we have data
    if (currentData) renderViewSpecifics(currentData);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast glass-effect';
    toast.innerText = message;
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Actions
function login() {
    console.log("Login triggered"); // Keep console log
    const name = dom.usernameInput.value.trim();
    if (name) {
        currentUser = name;
        localStorage.setItem('padel_username', currentUser);
        showDashboard();
    } else {
        alert("Please enter a name!"); // User feedback for empty input
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('padel_username');
    showLogin();
}

function showLogin() {
    stopPolling();
    views.dashboard.classList.add('hidden');
    views.login.classList.remove('hidden');
}

function showDashboard() {
    dom.userDisplayName.innerText = currentUser;
    views.login.classList.add('hidden');
    views.dashboard.classList.remove('hidden');

    if (!charts.courts) initCharts(); // Only init if not exists

    startPolling();
    fetchDashboard();
}

// Data Fetching
async function fetchDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard?user=${currentUser}`);
        const data = await res.json();

        // Simple Deep Equal Check + Force render if explicitly requested (e.g. view switch)
        // For now, simpler to just render always on view switch but check diff for poll
        if (JSON.stringify(currentData) !== JSON.stringify(data)) {
            currentData = data;
            renderDashboard(data);
            renderViewSpecifics(data);
        } else if (currentView !== 'dashboard') {
            // Ensure sub-views render even if main data is stable
            renderViewSpecifics(data);
        }
    } catch (e) {
        console.error("Fetch error", e);
    }
}

async function setStatus(status) {
    const endpoint = status === 'in' ? '/join' : '/leave';
    try {
        await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentUser })
        });
        showToast(status === 'in' ? "You're confirmed! 🎾" : "You Checked Out");
        fetchDashboard();
    } catch (e) {
        console.error("Action error", e);
    }
}

// Rendering
function renderDashboard(data) {
    if (!data) return;

    // Quick Stats
    dom.totalPlayersVal.innerText = data.totalPlayers;
    dom.weatherTemp.innerText = data.stats.weather.temp;
    dom.weatherCond.innerText = data.stats.weather.condition;
    dom.nextMatchTime.innerText = data.stats.nextMatch.time;
    dom.nextMatchTeams.innerText = data.stats.nextMatch.teams;

    // Lists
    dom.motmName.innerText = data.stats.manOfTheMatch.name;
    dom.motmPoints.innerText = `${data.stats.manOfTheMatch.points} Pts`;
    dom.discountBanner.innerText = data.stats.discount;
    dom.waitCount.innerText = data.stats.waitingList;

    // Roster - Optimized Rendering (Diffing logic simplified)
    const activePlayers = data.players || [];

    // Only rebuild if count changes to avoid simple flicker, 
    // ideally we modify in place but for now clearing innerHTML is fine IF data actually changed.
    dom.rosterList.innerHTML = '';
    activePlayers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span>${p.name} ${highlightUser(p.name)}</span>
            <span class="status-badge ${p.status === 'in' ? 'badge-in' : 'badge-out'}">${p.status.toUpperCase()}</span>
        `;
        dom.rosterList.appendChild(div);
    });

    // My Status Button State
    const myPlayer = activePlayers.find(p => p.name.toLowerCase() === currentUser.toLowerCase());
    if (myPlayer && myPlayer.status === 'in') {
        dom.btnIn.style.opacity = '1';
        dom.btnOut.style.opacity = '0.5';
    } else {
        dom.btnIn.style.opacity = '0.5';
        dom.btnOut.style.opacity = '1';
    }

    // Update Charts
    updateCharts(data);
}

function renderViewSpecifics(data) {
    if (currentView === 'my-team') {
        const team = data.stats.myTeam;
        if (team) {
            document.getElementById('team-name-big').innerText = team.name;
            document.getElementById('team-rank').innerText = `#${team.rank}`;
            document.getElementById('team-wins').innerText = team.wins;
            document.getElementById('team-next-match').innerText = team.nextMatch;

            const list = document.getElementById('team-roster-list');
            list.innerHTML = '';
            team.members.forEach(m => {
                // Reuse stat card style for members
                const div = document.createElement('div');
                div.className = 'glass-effect';
                div.style.padding = '15px';
                div.innerHTML = `<strong>${m}</strong>`;
                list.appendChild(div);
            });
        }
    } else if (currentView === 'courts') {
        const container = document.getElementById('courts-grid-container');
        container.innerHTML = '';
        data.stats.detailedCourts.forEach(c => {
            const div = document.createElement('div');
            // Check usage
            const isFree = c.status === 'Free';
            div.className = 'glass-effect';
            div.style.padding = '20px';
            div.style.border = isFree ? '1px solid var(--primary-neon)' : '1px solid #ff4444';
            div.style.background = isFree ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 100, 100, 0.05)';

            div.innerHTML = `
                <h3 style="margin-bottom: 5px;">Court ${c.id}</h3>
                <p style="font-size: 0.9rem; color: #a0a0a0;">${c.type}</p>
                <div style="margin-top: 15px; font-weight: 800; color: ${isFree ? 'var(--primary-neon)' : '#ff4444'}">
                    ${c.status.toUpperCase()}
                </div>
                 <p style="font-size: 0.8rem; margin-top: 5px;">Next Slot: ${c.nextSlot}</p>
            `;
            container.appendChild(div);
        });
    } else if (currentView === 'tournaments') {
        const container = document.getElementById('tournaments-list');
        container.innerHTML = '';
        data.stats.tournaments.forEach(t => {
            const div = document.createElement('div');
            div.className = 'glass-effect';
            div.style.padding = '20px';
            div.style.marginBottom = '20px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            div.innerHTML = `
                <div>
                    <h3 style="color: var(--accent-blue);">${t.name}</h3>
                    <p>Stage: ${t.stage}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2rem; font-weight: 800;">${t.prize}</div>
                    <div style="font-size: 0.8rem; color: #a0a0a0;">Grand Prize</div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

function highlightUser(name) {
    return name.toLowerCase() === currentUser.toLowerCase() ? '(You)' : '';
}

// Chart.js Logic
function initCharts() {
    const ctxCourts = document.getElementById('courtsChart').getContext('2d');
    const ctxTeams = document.getElementById('teamsChart').getContext('2d');

    Chart.defaults.color = '#a0a0a0';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    charts.courts = new Chart(ctxCourts, {
        type: 'bar',
        data: {
            labels: ['Indoor', 'Outdoor', 'Booked', 'Free'],
            datasets: [{
                label: 'Court Status',
                data: [0, 0, 0, 0],
                backgroundColor: ['#39ff14', '#00f0ff', '#ff4444', '#ffffff'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Fits to container height now
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
    });

    charts.teams = new Chart(ctxTeams, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#39ff14', '#00f0ff', '#f0f', '#ffcc00', '#ff0000', '#00ff00'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

function updateCharts(data) {
    if (charts.courts) {
        charts.courts.data.datasets[0].data = [
            data.courtStatus.indoor.total,
            data.courtStatus.outdoor.total,
            data.courtStatus.total - data.courtStatus.available,
            data.courtStatus.available
        ];
        charts.courts.update('none'); // 'none' mode prevents full re-animation flicker
    }

    if (charts.teams) {
        charts.teams.data.labels = data.teams.map(t => t.name);
        charts.teams.data.datasets[0].data = data.teams.map(t => t.members);
        charts.teams.update('none');
    }
}

function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchDashboard, REFRESH_RATE);
}

function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
}

// Listeners
dom.loginBtn.addEventListener('click', login);
// logoutBtn listener is now inside setupSidebar
dom.btnIn.addEventListener('click', () => setStatus('in'));
dom.btnOut.addEventListener('click', () => setStatus('out'));
dom.usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

init();
