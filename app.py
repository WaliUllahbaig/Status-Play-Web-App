from flask import Flask, jsonify, request, send_from_directory
import json
import os
import datetime
import random

app = Flask(__name__, static_folder='static')

DATA_FILE = 'data.json'
SKILL_LEVELS = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

def read_data():
    if not os.path.exists(DATA_FILE):
        return {"host": "Coordinator", "cutoffHour": 17, "players": [], "teams": [], "courtStatus": {}}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def write_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_assigned_team(user_name, teams):
    """
    Deterministically assigns a team to a user based on their name.
    """
    if not teams:
        return "Unassigned"
    random.seed(user_name)
    team = random.choice(teams)
    random.seed() # Reset
    return team['name']

def generate_mock_stats(user_name=None, data=None):
    """
    Generates dynamic mock data. 
    """
    weather_conditions = ['Clear Night', 'Breezy', 'Humid', 'Perfect Padel Weather']
    marketing_discounts = ['20% Off for Students', 'Buy 1 Get 1 Hour Free', 'Weekend Special: Free Gatorade']
    
    # Tournament Mock
    tournaments = [
        {"name": "Winter Open 2026", "stage": "Quarter Finals", "prize": "50,000 PKR"},
        {"name": "Corporate League", "stage": "Group Stage", "prize": "100,000 PKR"}
    ]
    
    # Detailed Courts Mock (Single Source of Truth)
    detailed_courts = []
    indoor_total = 0
    indoor_free = 0
    outdoor_total = 0
    outdoor_free = 0

    for i in range(1, 9):
        is_indoor = i <= 4
        status = random.choice(['Free', 'Free', 'Booked', 'Booked', 'Maintenance']) 
        wait = 0 if status == 'Free' else random.randint(0, 3)
        c_type = "Indoor" if is_indoor else "Outdoor"
        
        detailed_courts.append({
            "id": i,
            "type": c_type,
            "status": status,
            "waiting": wait,
            "nextSlot": "18:00" if status == 'Booked' else "Now"
        })

        if is_indoor:
            indoor_total += 1
            if status == 'Free': indoor_free += 1
        else:
            outdoor_total += 1
            if status == 'Free': outdoor_free += 1

    derived_court_status = {
        "total": indoor_total + outdoor_total,
        "available": indoor_free + outdoor_free,
        "indoor": { "total": indoor_total, "available": indoor_free },
        "outdoor": { "total": outdoor_total, "available": outdoor_free }
    }

    # Find user's team details
    my_team = None
    if user_name and data:
        team_name = get_assigned_team(user_name, data.get('teams', []))
        full_team = next((t for t in data.get('teams', []) if t['name'] == team_name), None)
        if full_team:
            my_team = {
                "name": full_team['name'],
                "rank": random.randint(1, 5),
                "wins": full_team['wins'],
                "difficulty": full_team.get('difficulty', 'Medium'),
                "nextMatch": f"vs {random.choice([t['name'] for t in data.get('teams', []) if t['name'] != team_name])} @ 20:00",
                "members": full_team['members']
            }

    return {
        "weather": {
            "condition": random.choice(weather_conditions),
            "temp": f"{random.randint(18, 28)}°C",
            "wind": f"{random.randint(5, 15)} km/h"
        },
        "nextMatch": {
            "teams": "Lahore Lions vs Karachi Kings",
            "time": "20:00",
            "court": f"Court {random.randint(1, 4)}"
        },
        "manOfTheMatch": {
            "name": "Babar Azam",
            "points": 1500,
            "avatar": "👑"
        },
        "discount": random.choice(marketing_discounts),
        "waitingList": random.randint(2, 8),
        "detailedCourts": detailed_courts,
        "derivedCourtStatus": derived_court_status, 
        "tournaments": tournaments,
        "myTeam": my_team
    }

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/session', methods=['GET'])
def get_session():
    data = read_data()
    now = datetime.datetime.now()
    return jsonify({
        "players": data.get('players', []),
        "cutoffHour": data.get('cutoffHour', 17),
        "serverTime": now.isoformat()
    })

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Returns aggregated data for the dashboard view."""
    user = request.args.get('user')
    data = read_data()
    stats = generate_mock_stats(user, data)
    
    active_players = len([p for p in data.get('players', []) if p.get('status') == 'in'])
    
    return jsonify({
        "stats": stats,
        "courtStatus": stats['derivedCourtStatus'], 
        "teams": data.get('teams', []),
        "players": data.get('players', []),  # FIX: Roster list now included
        "activePlayers": active_players,
        "totalPlayers": len(data.get('players', []))
    })

@app.route('/api/join', methods=['POST'])
def join_session():
    name = request.json.get('name')
    if not name:
        return jsonify({"error": "Name required"}), 400
    
    data = read_data()
    assigned_team = get_assigned_team(name, data.get('teams', []))
    
    # Check duplicate
    for p in data['players']:
        if p['name'].lower() == name.lower():
            p['status'] = 'in'
            write_data(data)
            return jsonify({"status": "joined", "team": assigned_team, "data": data})

    # New Player
    data['players'].append({
        "name": name,
        "status": "in",
        "joinedAt": datetime.datetime.now().isoformat(),
        "points": random.randint(0, 500),
        "skill_level": random.choice(SKILL_LEVELS)
    })
    write_data(data)
    return jsonify({"status": "joined", "team": assigned_team, "data": data})

@app.route('/api/leave', methods=['POST'])
def leave_session():
    name = request.json.get('name')
    if not name:
        return jsonify({"error": "Name required"}), 400
    
    data = read_data()
    for p in data['players']:
        if p['name'].lower() == name.lower():
            p['status'] = 'out'
    write_data(data)
    return jsonify({"status": "left"})

@app.route('/api/reset', methods=['POST'])
def reset_session():
    data = read_data()
    data['players'] = []
    write_data(data)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
