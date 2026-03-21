from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS

# ==========================================
# 1. SERVER SETUP
# ==========================================
app = Flask(__name__)

# CORS (Cross-Origin Resource Sharing) allows your Next.js app (running on port 3000) 
# to talk to this Flask app (running on port 5000) without the browser blocking it for security.
CORS(app)

# Initialize SocketIO. 
# cors_allowed_origins="*" means we accept WebSocket connections from any IP address.
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# 2. THE GLOBAL MATCH STATE (Our "Database")
# ==========================================
# This dictionary is the absolute source of truth for the entire application.
# It perfectly matches the MatchState TypeScript interface we built in Next.js.
active_match = {
    "status": "setup",
    "currentSet": 1,
    "player1": {"name": "", "country": "", "score": 0, "setsWon": 0},
    "player2": {"name": "", "country": "", "score": 0, "setsWon": 0},
    "matchWinner": None
}

# ==========================================
# 3. SOCKET EVENT LISTENERS
# ==========================================

# EVENT: Built-in connection listener
@socketio.on('connect')
def handle_connect():
    print("🟢 A new device connected to the server.")

# EVENT: A user loads either the Umpire or Spectator page
@socketio.on('join_match')
def handle_join():
    # Instantly send them the current official score so they aren't looking at a blank or outdated screen.
    emit('sync_state', active_match)

# EVENT: The Umpire clicks a button and sends us new data
@socketio.on('umpire_action')
def handle_umpire_action(new_state):
    global active_match
    
    # 1. Overwrite our server's global state with the new data the umpire just sent
    active_match = new_state
    
    # Print a quick log to the terminal so you can verify data is flowing
    print(f"🏸 Score Update -> Set: {active_match['currentSet']} | {active_match['player1']['name']}: {active_match['player1']['score']} vs {active_match['player2']['name']}: {active_match['player2']['score']}")
    
    # 2. THE BROADCAST
    # Take this newly updated state and instantly blast it out to EVERY connected client.
    # This guarantees the Umpire and all Spectators are seeing the exact same numbers.
    emit('sync_state', active_match, broadcast=True)

# ==========================================
# 4. RUN THE SERVER
# ==========================================
if __name__ == '__main__':
    # host='0.0.0.0' binds the server to all network interfaces so other devices on your Wi-Fi can reach it.
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)