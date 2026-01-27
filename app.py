from flask import Flask, jsonify, request, send_from_directory
import json
import os
import datetime
import random

app = Flask(__name__, static_folder='static')

DATA_FILE = 'data.json'

def read_data():
    if not os.path.exists(DATA_FILE):
        return {"host": "Coordinator", "cutoffHour": 17, "players": [], "teams": [], "courtStatus": {}}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def write_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def generate_mock_stats(user_name=None, data=None):
    """Generates dynamic mock data for the dashboard and specific views."""
    weather_conditions = ['Clear Night', 'Breezy', 'Humid', 'Perfect Padel Weather']
    marketing_discounts = ['20% Off for Students', 'Buy 1 Get 1 Hour Free', 'Weekend Special: Free Gatorade']
    
    # Tournament Mock
    tournaments = [
        {"name": "Winter Open 2026", "stage": "Quarter Finals", "prize": "50,000 PKR"},
        {"name": "Corporate League", "stage": "Group Stage", "prize": "100,000 PKR"}
    ]
    
    # Detailed Courts Mock (randomized status for demo)
    detailed_courts = []
    for i in range(1, 9):
        status = random.choice(['Free', 'Booked', 'Maintenance'])
        wait = 0 if status == 'Free' else random.randint(0, 3)
        detailed_courts.append({
            "id": i,
            "type": "Indoor" if i <= 4 else "Outdoor",
            "status": status,
            "waiting": wait,
            "nextSlot": "18:00" if status == 'Booked' else "Now"
        })

    # Find user's team
    my_team = None
    if user_name and data:
        # Mock logic: assign user to 'Lahore Lions' if not explicitly set, for demo purposes
        # In a real app, this would be in the DB. We'll pick a random one for the demo per session or consistent
        random.seed(user_name) # Consistent random team based on name
        team_name = random.choice([t['name'] for t in data.get('teams', [])])
        full_team = next((t for t in data.get('teams', []) if t['name'] == team_name), None)
        if full_team:
            my_team = {
                "name": full_team['name'],
                "rank": random.randint(1, 5),
                "wins": full_team['wins'],
                "nextMatch": f"vs {random.choice([t['name'] for t in data.get('teams', []) if t['name'] != team_name])} @ 20:00",
                "members": [p['name'] for p in data.get('players', [])[:8]] # Mock members from player list
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
    
    # Calculate derived stats
    active_players = len([p for p in data.get('players', []) if p.get('status') == 'in'])
    
    return jsonify({
        "stats": stats,
        "courtStatus": data.get('courtStatus', {}),
        "teams": data.get('teams', []),
        "activePlayers": active_players,
        "totalPlayers": len(data.get('players', []))
    })

@app.route('/api/join', methods=['POST'])
def join_session():
    name = request.json.get('name')
    if not name:
        return jsonify({"error": "Name required"}), 400
    
    data = read_data()
    # Check duplicate
    for p in data['players']:
        if p['name'].lower() == name.lower():
            p['status'] = 'in'
            write_data(data)
            return jsonify(data)

    data['players'].append({
        "name": name,
        "status": "in",
        "joinedAt": datetime.datetime.now().isoformat()
    })
    write_data(data)
    return jsonify(data)

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
    return jsonify(data)

@app.route('/api/reset', methods=['POST'])
def reset_session():
    data = read_data()
    data['players'] = []
    write_data(data)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
