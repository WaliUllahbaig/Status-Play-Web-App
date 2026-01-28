# StatusPlay - Professional Padel Coordination System

![StatusPlay Banner](https://img.shields.io/badge/StatusPlay-v3.2-39ff14?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBzdHJva2U9IiMzOWZmMTQiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-green?style=flat-square&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

## 📋 Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## 🎯 Overview

**StatusPlay** is a cutting-edge, real-time coordination platform designed specifically for after-work padel enthusiasts. It streamlines player availability tracking, team management, court reservations, and inter-team communication—all in one sleek, professional dashboard.

### Why StatusPlay?

Traditional coordination methods (WhatsApp groups, spreadsheets, phone calls) are chaotic, inefficient, and error-prone. StatusPlay brings **enterprise-grade organization** to recreational sports with:
- ⚡ **Real-time updates** (40-second polling)
- 🎨 **Premium UI/UX** with glassmorphism and neon accents
- 📊 **Data-driven insights** via interactive charts
- 💬 **Team chat** with localStorage persistence
- 🏆 **Gamification** through points and skill levels

---

## 🚨 Problem Statement

### The Challenge
After-work padel groups face recurring coordination nightmares:

1. **Availability Chaos**: "Who's playing tonight?" messages flood group chats
2. **Court Confusion**: No centralized view of court availability
3. **Team Imbalance**: Random team assignments lead to unfair matches
4. **Communication Overload**: Important updates buried in chat history
5. **No Accountability**: Players forget to update status, causing last-minute cancellations
6. **Lack of Progression Tracking**: No way to track improvement or team performance

### Impact
- ⏰ **30+ minutes wasted** daily on coordination
- 😤 **Player frustration** from disorganization
- 🎾 **Reduced playtime** due to inefficient scheduling
- 📉 **Lower participation** rates over time

---

## ✅ Our Solution

StatusPlay transforms padel coordination with a **centralized, automated, and intelligent platform**:

### Core Innovations

#### 1. **One-Click Status Updates**
Players mark themselves "IN" or "OUT" with a single button press. No more endless group chat messages.

#### 2. **Smart Team Assignment**
Deterministic algorithm assigns players to balanced teams based on:
- Skill level (Beginner → Expert)
- Historical performance
- Team size constraints (max 4 players)

#### 3. **Live Dashboard**
Real-time visibility into:
- 📊 Court availability (Indoor/Outdoor)
- 👥 Active player roster
- 🏅 Team rankings (sorted by wins)
- 🌤️ Weather conditions
- 🎯 Upcoming matches

#### 4. **Team Communication Hub**
Dedicated chat channels for each team with:
- Message persistence (localStorage)
- Timestamp tracking
- Color-coded user identification

#### 5. **Comprehensive Profile Management**
Players can:
- View personal stats (points, skill level, team)
- Update contact info (email, phone)
- Set preferred play slots
- Request team changes

#### 6. **Professional Game Info**
Structured tables for:
- Points calculation system
- Skill level descriptions
- Tournament schedules

---

## 🌟 Key Features

### 🎨 **Premium Design**
- **Glassmorphism UI** with backdrop blur effects
- **Neon color scheme** (#39ff14 primary, #00f0ff accent)
- **Smooth animations** (float, fade-in effects)
- **Responsive layout** (desktop & mobile)

### 📊 **Data Visualization**
- **Bar Chart**: Live court status (Indoor/Outdoor/Booked/Free)
- **Donut Chart**: Team distribution by **win count** (not member count)
- **Dynamic Tables**: Sortable team rankings

### 🔄 **Real-Time Sync**
- 40-second auto-refresh
- Optimized rendering (no flicker)
- Cache busting for instant updates

### 💬 **Team Collaboration**
- In-app chat per team
- Dummy messages for first-time users
- Enter-to-send functionality

### 🏆 **Gamification**
- Points system (Win: +10, Draw: +5, Participation: +2, MOTM: +50)
- 5-tier skill levels (Beginner → Expert)
- Team rankings leaderboard

### 🎮 **User Experience**
- Toast notifications (2x larger in v3.0)
- Sidebar navigation with active state highlighting
- Professional table formatting
- Request team change functionality

---

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**
- **Flask 2.0+** (Web framework)
- **JSON** (Data persistence)

### Frontend
- **Vanilla JavaScript (ES6+)**
- **HTML5** (Semantic markup)
- **CSS3** (Custom properties, Grid, Flexbox)
- **Chart.js** (Data visualization)
- **Ionicons** (Icon library)

### Design
- **Google Fonts** (Outfit typeface)
- **Glassmorphism** aesthetic
- **Neon color palette**

---

## 📦 Installation

### Prerequisites
```bash
# Python 3.8 or higher
python --version

# pip package manager
pip --version
```

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/StatusPlay.git
cd StatusPlay
```

2. **Install dependencies**
```bash
pip install flask
```

3. **Initialize data file**
```bash
# data.json is included, but you can reset it:
python -c "import json; json.dump({'host': 'Coordinator', 'cutoffHour': 17, 'players': [], 'teams': [], 'courtStatus': {}}, open('data.json', 'w'), indent=2)"
```

4. **Run the application**
```bash
python app.py
```

5. **Access the dashboard**
```
Open browser: http://localhost:5000
```

---

## 🎮 Usage

### For Players

1. **Login**
   - Enter your name on the landing page
   - Click "ENTER COURT"

2. **Update Status**
   - Click "I'M IN" to confirm participation
   - Click "I'M OUT" to opt out
   - See instant toast notification with team assignment

3. **View Dashboard**
   - Check live court availability
   - See active player roster
   - Monitor team rankings

4. **Manage Profile**
   - Navigate to "My Profile"
   - View your points, skill level, and team
   - Update email, phone, and preferred play slots

5. **Team Chat**
   - Click "Team Chat" in sidebar
   - Send messages to your team
   - Messages persist across sessions

6. **Explore Features**
   - **My Team**: View squad members, request team change
   - **Courts**: See detailed status of all 8 courts
   - **Tournaments**: Browse active competitions
   - **Team Rankings**: Check leaderboard (sorted by wins)
   - **Game Info**: Learn scoring system and skill levels

### For Coordinators

- Monitor player availability in real-time
- Review team balance and performance
- Manage court allocations
- Track tournament progress

---

## 📸 Screenshots

### Dashboard View
![Dashboard](./screenshots/dashboard.png)
*Real-time overview with stats, charts, and active roster*

### Team Chat
![Team Chat](./screenshots/team_chat.png)
*Dedicated communication channel for each team*

### My Profile
![Profile](./screenshots/profile.png)
*Personal stats and contact information management*

### Team Rankings
![Rankings](./screenshots/rankings.png)
*Leaderboard sorted by total match wins*

### Game Info
![Game Info](./screenshots/game_info.png)
*Professional tables for scoring and skill levels*

---

## 📁 Project Structure

```
StatusPlay/
├── app.py                 # Flask backend (API endpoints, mock data)
├── data.json              # Player/team data persistence
├── static/
│   ├── index.html         # Main application UI
│   ├── script.js          # Frontend logic (charts, views, chat)
│   └── style.css          # Glassmorphism styling
├── README.md              # This file
└── screenshots/           # UI screenshots (optional)
```

---

## 🔧 Configuration

### Customization Options

**Refresh Rate** (`script.js`):
```javascript
const REFRESH_RATE = 40000; // 40 seconds (adjust as needed)
```

**Cutoff Hour** (`data.json`):
```json
{
  "cutoffHour": 17  // 5 PM daily deadline
}
```

**Team Names** (`data.json`):
```json
{
  "teams": [
    {"name": "Urban Gladiators", "wins": 24, ...},
    {"name": "Neon Titans", "wins": 18, ...}
  ]
}
```

---

## 🚀 Roadmap

### Upcoming Features (v4.0)
- [ ] User authentication (JWT tokens)
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Push notifications (Web Push API)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated team balancing algorithm
- [ ] Court booking integration
- [ ] Payment processing for tournaments

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- **Python**: PEP 8
- **JavaScript**: ES6+ with semicolons
- **CSS**: BEM methodology

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**StatusPlay Development Team**
- Lead Developer: [Your Name]
- UI/UX Designer: [Designer Name]
- Backend Engineer: [Engineer Name]

---

## 🙏 Acknowledgments

- **Chart.js** for beautiful data visualization
- **Ionicons** for premium icon set
- **Google Fonts** for Outfit typeface
- **Flask** community for excellent documentation
- All padel enthusiasts who inspired this project

---

## 📞 Support

For issues, questions, or feature requests:
- 📧 Email: support@statusplay.com
- 🐛 GitHub Issues: [Create an issue](https://github.com/yourusername/StatusPlay/issues)
- 💬 Discord: [Join our community](https://discord.gg/statusplay)

---

<div align="center">

**Made with ❤️ for the Padel Community**

⭐ Star this repo if you find it useful!

</div>
