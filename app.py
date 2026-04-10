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
    try:
        with open("users.txt", "r") as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) >= 2:
                    u = parts[0]
                    p = parts[1]
                    pts = int(parts[2]) if len(parts) > 2 else 5
                    users[u] = {"password": p, "points": pts}
    except FileNotFoundError:
        pass
    return users

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/forum")
def forum():
    return render_template("forum.html")

@app.route("/profile")
def profile():
    if "username" not in session:
        return redirect(url_for("auth"))
    return render_template("profile.html")

@app.route("/auth", methods=["GET", "POST"])
def auth():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        action = request.form.get("action")
        
        users = get_users()
        
        if action == "register":
            if username in users:
                return "User already exists! <a href='/auth'>Try again</a>"
            with open("users.txt", "a") as f:
                f.write(f"{username},{password}\n")
            session["username"] = username
            return redirect(url_for("index"))
            
        elif action == "login":
            if users.get(username) == password:
                session["username"] = username
                return redirect(url_for("index"))
            return "Wrong username or password! <a href='/auth'>Try again</a>"
            
    return render_template("auth.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("index"))

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("auth"))
    return render_template("chat.html")

@socketio.on('send_message')
def handle_message(data):
    username = session.get('username', 'Guest')
    msg = data.get('message')
    
    emit('receive_message', {'username': username, 'message': msg}, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True)