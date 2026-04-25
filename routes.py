from flask import request, jsonify, render_template, session, redirect, url_for, abort
from app import app, db
from models import User, Question, Answer, Rating, Subject, Grade, SubjectGrade
from werkzeug.security import generate_password_hash, check_password_hash

# REGISTER
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({"message": "User created"})


# LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"message": "Login success", "user_id": user.id})

    return jsonify({"error": "Invalid credentials"}), 401


# CREATE QUESTION
@app.route('/questions', methods=['POST'])
def create_question():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.json or {}
    subject_name = (data.get('subject') or '').strip()
    grade_name = (data.get('grade') or '').strip()
    title = (data.get('title') or '').strip()
    content = (data.get('content') or '').strip()

    if not subject_name or not grade_name or not title:
        return jsonify({'error': 'Subject, grade, and title are required.'}), 400

    subject = Subject.query.filter_by(name=subject_name).first()
    grade = Grade.query.filter_by(name=grade_name).first()
    if not subject or not grade:
        return jsonify({'error': 'Subject or grade not found.'}), 400

    subject_grade = SubjectGrade.query.filter_by(subject_id=subject.id, grade_id=grade.id).first()
    if not subject_grade:
        return jsonify({'error': 'This subject grade combination does not exist.'}), 400

    q = Question(
        user_id=session['user_id'],
        subject_grade_id=subject_grade.id,
        title=title,
        content=content
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({"message": "Question created", "id": q.id})


# GET QUESTIONS
@app.route('/questions', methods=['GET'])
def get_questions():
    subject_name = request.args.get('subject', '').strip()
    grade_name = request.args.get('grade', '').strip()

    query = Question.query
    if subject_name and grade_name:
        query = query.join(SubjectGrade).join(Subject).join(Grade).filter(
            Subject.name == subject_name,
            Grade.name == grade_name
        )

    questions = query.all()
    return jsonify([
        {
            "id": q.id,
            "title": q.title,
            "content": q.content,
            "created_at": q.created_at.strftime('%Y-%m-%d %H:%M'),
            "user": User.query.get(q.user_id).username if q.user_id else 'Unknown'
        }
        for q in questions
    ])


@app.route('/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    q = Question.query.get_or_404(question_id)
    subject_grade = SubjectGrade.query.get(q.subject_grade_id)
    subject_name = subject_grade.subject.name if subject_grade and subject_grade.subject else ''
    grade_name = subject_grade.grade.name if subject_grade and subject_grade.grade else ''
    answers = Answer.query.filter_by(question_id=q.id).all()
    return jsonify({
        "id": q.id,
        "title": q.title,
        "content": q.content,
        "created_at": q.created_at.strftime('%Y-%m-%d %H:%M'),
        "user": User.query.get(q.user_id).username if q.user_id else 'Unknown',
        "subject": subject_name,
        "grade": grade_name,
        "answers_count": len(answers),
        "type": "Question",
        "answers": [
            {
                "id": a.id,
                "content": a.content,
                "created_at": a.created_at.strftime('%Y-%m-%d %H:%M'),
                "user": User.query.get(a.user_id).username if a.user_id else 'Unknown'
            }
            for a in answers
        ]
    })


# GET USERS
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "rating": float(u.rating or 0),
            "points": int(u.points or 0)
        }
        for u in users
    ])


# GET SUBJECTS
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    subjects = Subject.query.all()
    result = []
    for subj in subjects:
        grades = []
        for sg in subj.subject_grades:
            if sg.grade and sg.grade.name not in grades:
                grades.append(sg.grade.name)
        result.append({
            "id": subj.id,
            "name": subj.name,
            "grades": grades
        })
    return jsonify(result)


# ANSWER QUESTION
@app.route('/answers', methods=['POST'])
def answer_question():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.json or {}
    question_id = data.get('question_id')
    content = (data.get('content') or '').strip()

    if not question_id or not content:
        return jsonify({'error': 'Question and content are required.'}), 400

    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': 'Question not found.'}), 404

    a = Answer(
        question_id=question_id,
        user_id=session['user_id'],
        content=content
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({"message": "Answer added", "id": a.id})


# RATE USER
@app.route('/rate', methods=['POST'])
def rate_user():
    data = request.json
    rating = Rating(
        from_user_id=data['from_user_id'],
        to_user_id=data['to_user_id'],
        value=data['value']
    )
    db.session.add(rating)
    db.session.commit()
    return jsonify({"message": "User rated"})


# LOGOUT
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('spa', page='home'))


# ADD SUBJECT
@app.route('/add_subject', methods=['POST'])
def add_subject():
    subject_name = request.form.get('subject_name', '').strip()
    grades_str = request.form.get('grades', '').strip()

    def json_response(message, status='error'):
        return jsonify({'status': status, 'message': message})

    if not subject_name:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return json_response('Subject name is required.', 'error')
        return redirect(url_for('spa', page='forum'))

    if not grades_str:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return json_response('Please add at least one class level.', 'error')
        return redirect(url_for('spa', page='forum'))

    grades_list = [grade.strip() for grade in grades_str.split(',') if grade.strip()]
    if not grades_list:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return json_response('Please add at least one class level.', 'error')
        return redirect(url_for('spa', page='forum'))

    subject = Subject.query.filter_by(name=subject_name).first()
    if not subject:
        subject = Subject(name=subject_name)
        db.session.add(subject)
        db.session.commit()

    created = 0
    duplicates = []
    for grade_name in grades_list:
        grade = Grade.query.filter_by(name=grade_name).first()
        if not grade:
            grade = Grade(name=grade_name)
            db.session.add(grade)
            db.session.commit()

        subject_grade = SubjectGrade.query.filter_by(subject_id=subject.id, grade_id=grade.id).first()
        if subject_grade:
            duplicates.append(grade_name)
        else:
            db.session.add(SubjectGrade(subject_id=subject.id, grade_id=grade.id))
            created += 1

    db.session.commit()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        if created == 0:
            return json_response(f'Level {duplicates[0]} already exists for {subject_name}.', 'error')
        if duplicates:
            return json_response(
                f'Added {created} levels. Already existed: {", ".join(duplicates)}.',
                'success'
            )
        return json_response(f'Subject {subject_name} added successfully.', 'success')

    return redirect(url_for('spa', page='forum'))


# AUTH PAGE
@app.route('/auth', methods=['GET', 'POST'])
def auth():
    auth_error = None
    if request.method == 'POST':
        action = request.form.get('action')
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        if action == 'login':
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password_hash, password):
                session['user_id'] = user.id
                session['username'] = user.username
                return redirect(url_for('spa', page='home'))
            auth_error = 'Invalid email or password'

        elif action == 'register':
            confirm_password = request.form.get('confirm_password', '')
            if password != confirm_password:
                auth_error = 'Passwords do not match'
            elif User.query.filter_by(email=email).first():
                auth_error = 'Email already exists'
            else:
                username = email.split('@')[0] if '@' in email else email
                user = User(
                    username=username,
                    email=email,
                    password_hash=generate_password_hash(password)
                )
                db.session.add(user)
                db.session.commit()
                session['user_id'] = user.id
                session['username'] = user.username
                return redirect(url_for('spa', page='home'))

    return render_template(
        'index.html',
        points=0,
        username=session.get('username', 'Guest'),
        auth_error=auth_error,
        active_page='auth'
    )


# HOME PAGE
@app.route('/')
def home():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
    else:
        points = 0
        username = 'Guest'
    return render_template('index.html', points=points, username=username)


@app.route('/subject/<subject_name>/<grade>')
def subject_detail(subject_name, grade):
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
    else:
        points = 0
        username = 'Guest'
    return render_template('index.html', points=points, username=username)


@app.route('/post/<int:question_id>')
def post_detail(question_id):
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
    else:
        points = 0
        username = 'Guest'
    return render_template('index.html', points=points, username=username)


@app.route('/', defaults={'page': 'home'})
@app.route('/<page>')
def spa(page):
    allowed = {'home', 'forum', 'profile', 'search', 'chat'}
    if page not in allowed:
        abort(404)

    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
    else:
        points = 0
        username = 'Guest'

    return render_template('index.html', points=points, username=username)