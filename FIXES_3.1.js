/**
 * StatusPlay 3.1 - JavaScript Fixes & Enhancements
 * 
 * INSTRUCTIONS: Copy the functions below and add them to script.js
 * 
 * 1. Add renderProfileView() before renderSettingsView() (around line 363)
 * 2. Add renderTeamChatView() after renderProfileView()
 * 3. Update switchView() to add 'team-chat' to titles object
 * 4. Update updateCharts() to fix donut chart proportions
 */

// ============================================================================
// 1. PROFILE VIEW WITH USER STATS (Insert before renderSettingsView)
// ============================================================================

async function renderProfileView(data) {
    const me = data.players.find(p => p.name.toLowerCase() === currentUser.toLowerCase());
    if (!me) return;

    // Display user info
    document.getElementById('profile-name').innerText = me.name;

    // Get user's team
    const myTeam = data.stats.myTeam;
    const teamName = myTeam ? myTeam.name : "No Team";

    // Add stats display to profile
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

    // Load profile data
    const profile = me.profile || {};
    document.getElementById('profile-email').value = profile.email || "";
    document.getElementById('profile-phone').value = profile.phone || "";
    document.getElementById('profile-slots').value = profile.slots || "";

    // Save button handler
    document.getElementById('save-profile-btn').onclick = async () => {
        const updated = {
            name: currentUser,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            slots: document.getElementById('profile-slots').value
        };
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (res.ok) showToast("✅ Profile Updated Successfully!");
    };
}

// ============================================================================
// 2. TEAM CHAT VIEW (Insert after renderProfileView)
// ============================================================================

function renderTeamChatView(data) {
    const myTeam = data.stats.myTeam;
    if (!myTeam) {
        document.getElementById('chat-messages').innerHTML = '<p style="color: #a0a0a0; text-align: center; padding: 50px;">You are not assigned to a team yet.</p>';
        return;
    }

    // Load chat messages from localStorage
    const chatKey = `chat_${myTeam.name}`;
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');

    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = '';

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
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong style="color: ${msg.user === currentUser ? 'var(--primary-neon)' : 'var(--accent-blue)'};">${msg.user}</strong>
                    <span style="font-size: 0.75rem; color: #888;">${msg.time}</span>
                </div>
                <div>${msg.text}</div>
            `;
            chatContainer.appendChild(div);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Send button handler
    document.getElementById('send-chat-btn').onclick = () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        const newMsg = {
            user: currentUser,
            text: text,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        messages.push(newMsg);
        localStorage.setItem(chatKey, JSON.stringify(messages));
        input.value = '';
        renderTeamChatView(data);
    };

    // Enter key to send
    document.getElementById('chat-input').onkeypress = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('send-chat-btn').click();
        }
    };
}

// ============================================================================
// 3. UPDATE switchView() - Add 'team-chat' to titles
// ============================================================================

// FIND this section in switchView() and UPDATE:
const titles = {
    'dashboard': 'Dashboard Preview',
    'profile': 'My Pro Profile',
    'my-team': 'My Squad',
    'team-chat': 'Team Chat',  // ADD THIS LINE
    'courts': 'Court Status',
    'tournaments': 'Tournaments',
    'info': 'Team Rankings',
    'settings': 'Settings'
};

// ============================================================================
// 4. UPDATE renderViewSpecifics() - Add team-chat case
// ============================================================================

// FIND renderViewSpecifics() and ADD this case:
function renderViewSpecifics(data) {
    if (currentView === 'profile') {
        renderProfileView(data);
    } else if (currentView === 'team-chat') {
        renderTeamChatView(data);  // ADD THIS
    } else if (currentView === 'my-team') {
        // ... existing code

        // ADD THIS at the end of my-team section:
        document.getElementById('request-team-change-btn').onclick = () => {
            showToast("⚠️ Team change request submitted! Coordinator will review.");
        };
    }
    // ... rest of the function
}

// ============================================================================
// 5. FIX DONUT CHART - Update updateCharts() function
// ============================================================================

// FIND the teamsChart section in updateCharts() and REPLACE with:

// Team Distribution Chart (WIN-BASED PROPORTIONS)
const teamNames = data.teams.map(t => t.name);
const teamWins = data.teams.map(t => t.wins);  // USE WINS instead of member count

if (charts.teams) {
    charts.teams.data.labels = teamNames;
    charts.teams.data.datasets[0].data = teamWins;  // CHANGED
    charts.teams.update();
} else {
    charts.teams = new Chart(ctxTeams, {
        type: 'doughnut',
        data: {
            labels: teamNames,
            datasets: [{
                data: teamWins,  // CHANGED
                backgroundColor: ['#39ff14', '#00f0ff', '#ff6b6b', '#ffd93d', '#a78bfa'],
                borderWidth: 2,
                borderColor: '#0a1128'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed + ' wins';  // CHANGED
                        }
                    }
                }
            }
        }
    });
}
