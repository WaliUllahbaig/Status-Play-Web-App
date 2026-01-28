// MISSING FUNCTION - Add this right before renderSettingsView() at line 363

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
