const API_BASE = '/api';
const REFRESH_RATE = 40000; // 40 Seconds

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

    const titles = {
        'dashboard': 'Dashboard Preview',
        'profile': 'My Pro Profile',
        'my-team': 'My Squad',
        'team-chat': 'Team Chat',
        'courts': 'Court Status',
        'tournaments': 'Tournaments',
        'rankings': 'Team Rankings',
        'info': 'Game Info',
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

    // Remove after 4s (LARGER TOAST in 3.0)
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Actions
function login() {
    console.log("Login triggered");
    const name = dom.usernameInput.value.trim();
    if (name) {
        currentUser = name;
        localStorage.setItem('padel_username', currentUser);
        showDashboard();
    } else {
        alert("Please enter a name!");
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

    if (!charts.courts) initCharts();

    startPolling();
    fetchDashboard();
}

// Data Fetching
async function fetchDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard?user=${currentUser}`);
        const data = await res.json();

        if (JSON.stringify(currentData) !== JSON.stringify(data)) {
            currentData = data;
            renderDashboard(data);
            renderViewSpecifics(data);
        } else if (currentView !== 'dashboard') {
            renderViewSpecifics(data);
        }
    } catch (e) {
        console.error("Fetch error", e);
    }
}

async function setStatus(status) {
    const endpoint = status === 'in' ? '/join' : '/leave';
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentUser })
        });
        const result = await res.json();

        let msg = "You Checked Out";
        if (status === 'in') {
            const teamName = result.team || "Squad";
            msg = `Confirmed in ${teamName}! 🎾`;
        }
        showToast(msg);
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

    // Roster 
    const activePlayers = data.players || [];
    dom.rosterList.innerHTML = '';
    activePlayers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'list-item';

        const points = p.points || 0;
        const skill = p.skill_level || 'Beginner';
        const skillClass = `badge-skill skill-${skill.toLowerCase()}`;

        div.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <span>
                    ${p.name} ${highlightUser(p.name)} 
                    <span class="${skillClass}" style="margin-left:8px;">${skill}</span>
                </span>
                <span style="font-size: 0.8rem; color: #a0a0a0;">${points} Pts</span>
            </div>
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
    if (currentView === 'profile') {
        renderProfileView(data);
    } else if (currentView === 'my-team') {
        const team = data.stats.myTeam;
        if (team) {
            document.getElementById('team-name-big').innerText = team.name;
            document.getElementById('team-rank').innerText = `#${team.rank}`;
            document.getElementById('team-wins').innerText = team.wins;
            document.getElementById('team-next-match').innerText = team.nextMatch;

            const list = document.getElementById('team-roster-list');
            list.innerHTML = '';
            team.members.forEach(m => {
                const div = document.createElement('div');
                div.className = 'glass-effect';
                div.style.padding = '15px';
                div.innerHTML = `<strong>${m}</strong>`;
                list.appendChild(div);
            });

            // Team Change Request Button
            const changeBtn = document.getElementById('request-team-change-btn');
            if (changeBtn) {
                changeBtn.onclick = () => {
                    showToast("⚠️ Team change request submitted! Coordinator will review.");
                };
            }
        }
    } else if (currentView === 'team-chat') {
        renderTeamChatView(data);
    } else if (currentView === 'courts') {
        const container = document.getElementById('courts-grid-container');
        container.innerHTML = '';
        data.stats.detailedCourts.forEach(c => {
            const div = document.createElement('div');
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
    } else if (currentView === 'rankings') {
        renderInfoView(data);  // Reuse same table rendering
    } else if (currentView === 'info') {
        renderInfoView(data);
    } else if (currentView === 'settings') {
        renderSettingsView();
    }
}

function renderInfoView(data) {
    const container = document.getElementById('view-info');
    // Keep header, append table if not exists
    let tableContainer = document.getElementById('teams-table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'teams-table-container';
        tableContainer.style.marginTop = '30px';
        container.querySelector('.glass-effect').appendChild(tableContainer);
    }

    const teams = data.teams || [];
    let html = `
        <h3 style="margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom:10px;">Registered Teams</h3>
        <table style="width: 100%; border-collapse: collapse; color: #eee;">
            <thead>
                <tr style="text-align: left; color: var(--text-secondary); font-size: 0.9rem;">
                    <th style="padding: 10px;">Team Name</th>
                    <th style="padding: 10px;">Difficulty</th>
                    <th style="padding: 10px;">Wins</th>
                    <th style="padding: 10px;">Best Player</th>
                </tr>
            </thead>
            <tbody>
    `;

    teams.forEach(t => {
        const diffColor = getSkillColor(t.difficulty || 'Medium');
        // Mock best player
        const bestPlayer = (t.members && t.members[0]) ? t.members[0] : "None";
        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: 600;">${t.name}</td>
                <td style="padding: 12px;"><span class="status-badge" style="background: ${diffColor}; color: #fff; font-size: 0.7rem;">${t.difficulty || 'Medium'}</span></td>
                <td style="padding: 12px;">${t.wins}</td>
                <td style="padding: 12px; color: var(--accent-blue);">${bestPlayer} 👑</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

async function renderProfileView(data) {
    const me = data.players.find(p => p.name.toLowerCase() === currentUser.toLowerCase());
    if (!me) return;
    document.getElementById('profile-name').innerText = me.name;
    const myTeam = data.stats.myTeam;
    const teamName = myTeam ? myTeam.name : "No Team";
    const profileContainer = document.querySelector('#view-profile .glass-effect');
    let statsSection = document.getElementById('profile-stats-section');
    if (!statsSection) {
        statsSection = document.createElement('div');
        statsSection.id = 'profile-stats-section';
        statsSection.className = 'stats-grid';
        statsSection.style.marginBottom = '30px';
        profileContainer.insertBefore(statsSection, profileContainer.querySelector('.profile-form'));
    }
    statsSection.innerHTML = `
        <div class="stat-card glass-effect" style="background: rgba(57, 255, 20, 0.05);">
            <span class="stat-label">Total Points</span>
            <span class="stat-value" style="color: var(--primary-neon);">${me.points || 0}</span>
        </div>
        <div class="stat-card glass-effect">
            <span class="stat-label">Skill Level</span>
            <span class="stat-value" style="font-size: 1.5rem;">${me.skill_level || 'Beginner'}</span>
        </div>
        <div class="stat-card glass-effect">
            <span class="stat-label">Current Team</span>
            <span class="stat-value" style="font-size: 1.2rem; color: var(--accent-blue);">${teamName}</span>
        </div>
    `;
    const profile = me.profile || {};
    document.getElementById('profile-email').value = profile.email || "";
    document.getElementById('profile-phone').value = profile.phone || "";
    document.getElementById('profile-slots').value = profile.slots || "";
    document.getElementById('save-profile-btn').onclick = async () => {
        const updated = { name: currentUser, email: document.getElementById('profile-email').value, phone: document.getElementById('profile-phone').value, slots: document.getElementById('profile-slots').value };
        const res = await fetch(`${API_BASE}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        if (res.ok) showToast("✅ Profile Updated Successfully!");
    };
}

function renderTeamChatView(data) {
    const myTeam = data.stats.myTeam;
    if (!myTeam) {
        document.getElementById('chat-messages').innerHTML = '<p style="color: #a0a0a0; text-align: center; padding: 50px;">You are not assigned to a team yet.</p>';
        return;
    }
    const chatKey = `chat_${myTeam.name}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = '';
    if (messages.length === 0) {
        // Add dummy messages for first-time users
        const dummyMessages = [
            { user: myTeam.members[0] || 'Ahmed', text: 'Hey team! Ready for tonight\'s match?', time: '6:15 PM' },
            { user: myTeam.members[1] || 'Sara', text: 'Absolutely! I\'ve been practicing my serves 🎾', time: '6:22 PM' },
            { user: myTeam.members[2] || 'Bilal', text: 'Count me in! What time are we meeting?', time: '6:30 PM' },
            { user: myTeam.members[0] || 'Ahmed', text: 'Let\'s meet at Court 1 around 8 PM', time: '6:35 PM' }
        ];
        messages.push(...dummyMessages);
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }
    if (messages.length === 0) {
        chatContainer.innerHTML = '<p style="color: #a0a0a0; text-align: center; padding: 50px;">No messages yet. Start the conversation!</p>';
    } else {
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.style.marginBottom = '15px';
            div.style.padding = '12px';
            div.style.background = msg.user === currentUser ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.05)';
            div.style.borderRadius = '8px';
            div.style.borderLeft = msg.user === currentUser ? '3px solid var(--primary-neon)' : '3px solid #555';
            div.innerHTML = `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><strong style="color: ${msg.user === currentUser ? 'var(--primary-neon)' : 'var(--accent-blue)'};">${msg.user}</strong><span style="font-size: 0.75rem; color: #888;">${msg.time}</span></div><div>${msg.text}</div>`;
            chatContainer.appendChild(div);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    document.getElementById('send-chat-btn').onclick = () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        const newMsg = { user: currentUser, text: text, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
        messages.push(newMsg);
        localStorage.setItem(chatKey, JSON.stringify(messages));
        input.value = '';
        renderTeamChatView(data);
    };
    document.getElementById('chat-input').onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('send-chat-btn').click(); };
}

function renderSettingsView() {
    const container = document.getElementById('view-settings');
    container.innerHTML = `
        <div class="glass-effect" style="padding: 30px;">
            <h2>Settings</h2>
            <div style="margin-top: 30px; display: grid; gap: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Email Notifications</span>
                    <label class="switch"><input type="checkbox" checked><span class="slider round"></span></label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Dark Mode</span>
                    <label class="switch"><input type="checkbox" checked disabled><span class="slider round"></span></label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Sound Effects</span>
                    <label class="switch"><input type="checkbox"><span class="slider round"></span></label>
                </div>
                 <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Show Personal Stats Publicly</span>
                    <label class="switch"><input type="checkbox" checked><span class="slider round"></span></label>
                </div>
            </div>
            <p style="color: #a0a0a0; margin-top: 30px; font-size: 0.8rem;">StatusPlay v2.1 (Pro)</p>
        </div>
    `;
}

function highlightUser(name) {
    return name.toLowerCase() === currentUser.toLowerCase() ? '(You)' : '';
}

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
            maintainAspectRatio: false,
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
        charts.courts.update('none');
    }

    if (charts.teams) {
        charts.teams.data.labels = data.teams.map(t => t.name);
        charts.teams.data.datasets[0].data = data.teams.map(t => t.wins); // WIN-BASED PROPORTIONS
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

dom.loginBtn.addEventListener('click', login);
dom.btnIn.addEventListener('click', () => setStatus('in'));
dom.btnOut.addEventListener('click', () => setStatus('out'));
dom.usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

function getSkillColor(level) {
    const colors = {
        'Beginner': '#4caf50',
        'Easy': '#8bc34a',
        'Medium': '#ffc107',
        'Hard': '#ff9800',
        'Expert': '#f44336'
    };
    return colors[level] || '#a0a0a0';
}

init();
