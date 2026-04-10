import os
from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit

app = Flask(__name__, 
            template_folder='.', 
            static_folder='.', 
            static_url_path='', 
            root_path=os.getcwd())

app.secret_key = "study_buddy_student_project_key"
socketio = SocketIO(app)

def get_users():
    users = {}
    if os.path.exists("users.txt"):
        with open("users.txt", "r") as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) >= 2:
                    username = parts[0]
                    password = parts[1]
                    points = int(parts[2]) if len(parts) > 2 else 5
                    users[username] = {"pass": password, "pts": points}
    return users

def save_users(users):
    with open("users.txt", "w") as f:
        for u, data in users.items():
            f.write(f"{u},{data['pass']},{data['pts']}\n")

@app.route("/")
def index():
    users = get_users()
    current_user = session.get('username')
    pts = users.get(current_user, {}).get('pts', 0) if current_user else 0
    return render_template("index.html", points=pts)

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("auth"))
    users = get_users()
    pts = users.get(session['username'], {}).get('pts', 5)
    return render_template("chat.html", points=pts)

@app.route("/forum")
def forum():
    return render_template("forum.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

@app.route("/search")
def search():
    return render_template("search.html")    

@app.route("/auth", methods=["GET", "POST"])
def auth():
    if request.method == "POST":
        username, password, action = request.form.get("username"), request.form.get("password"), request.form.get("action")
        users = get_users()
        if action == "register":
            confirm_password = request.form.get("confirm_password")
            if password != confirm_password:
                return "Passwords do not match! <a href='/auth'>Try again</a>"
            if username in users: return "User exists! <a href='/auth'>Try again</a>"
            users[username] = {"pass": password, "pts": 5}
            save_users(users)
            session["username"] = username
            return redirect(url_for("index"))
        elif action == "login":
            if username in users and users[username]["pass"] == password:
                session["username"] = username
                return redirect(url_for("index"))
            return "Wrong login! <a href='/auth'>Try again</a>"
    return render_template("auth.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("index"))

@socketio.on('send_message')
def handle_message(data):
    username = session.get('username')
    users = get_users()
    if username in users:
        users[username]["pts"] -= 1  
        save_users(users)
        emit('receive_message', {'username': username, 'message': data['message']}, broadcast=True)
        emit('update_points', {'points': users[username]["pts"]})

@socketio.on('award_points')
def handle_award(data):
    helper = data.get('helper')
    users = get_users()
    if helper in users:
        users[helper]["pts"] += 2  
        save_users(users)
        emit('update_points', {'points': users[helper]["pts"]}, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True)