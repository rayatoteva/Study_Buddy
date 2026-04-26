from flask import request, jsonify, render_template, session, redirect, url_for, abort
from app import app, db
from models import User, Question, Answer, Rating, Subject, Grade, SubjectGrade, PointsHistory
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func

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

    asker = User.query.get(session['user_id'])
    if asker:
        asker.points = int(asker.points or 0) - 1
        db.session.add(PointsHistory(
            user_id=asker.id,
            action='ask_question',
            points=-1
        ))

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to create question'}), 500

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
                "user": User.query.get(a.user_id).username if a.user_id else 'Unknown',
                "user_id": a.user_id
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


@app.route('/api/me-summary', methods=['GET'])
def get_me_summary():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'points': int(user.points or 0)
    })


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

    # Reward helpers with +2 points for each posted answer.
    user = User.query.get(session['user_id'])
    if user:
        user.points = int(user.points or 0) + 2
        db.session.add(PointsHistory(
            user_id=user.id,
            action='help_someone',
            points=2
        ))

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to save answer'}), 500

    return jsonify({"message": "Answer added", "id": a.id})


# RATE USER
@app.route('/rate', methods=['POST'])
def rate_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    data = request.get_json(silent=True) or {}
    to_user_id = data.get('to_user_id')
    value = data.get('value')
    if not to_user_id or not value:
        return jsonify({'error': 'Missing to_user_id or value'}), 400
    if int(to_user_id) == session['user_id']:
        return jsonify({'error': 'You cannot rate yourself'}), 400
    subject = (data.get('subject') or '').strip()
    comment = (data.get('comment') or '').strip()
    rating = Rating(
        from_user_id=session['user_id'],
        to_user_id=int(to_user_id),
        value=int(value),
        subject=subject,
        comment=comment
    )
    db.session.add(rating)
    # Update the user's average rating
    to_user = User.query.get(int(to_user_id))
    if to_user:
        all_ratings = Rating.query.filter_by(to_user_id=int(to_user_id)).all()
        total = sum(r.value for r in all_ratings) + int(value)
        to_user.rating = total / (len(all_ratings) + 1)

        # Good rating bonus: +2 points for ratings 4 and 5.
        if int(value) >= 4:
            to_user.points = int(to_user.points or 0) + 2
            db.session.add(PointsHistory(
                user_id=to_user.id,
                action='good_rating',
                points=2
            ))
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to save rating'}), 500
    return jsonify({'message': 'User rated'})


@app.route('/api/my-ratings', methods=['GET'])
def my_ratings():
    if 'user_id' not in session:
        return jsonify([])
    ratings = Rating.query.filter_by(to_user_id=session['user_id']).order_by(Rating.id.desc()).all()
    result = []
    for r in ratings:
        from_user = User.query.get(r.from_user_id)
        result.append({
            'value': r.value,
            'subject': r.subject or '',
            'comment': r.comment or '',
            'from_username': from_user.username if from_user else 'Unknown'
        })
    return jsonify(result)


@app.route('/api/my-question-subjects', methods=['GET'])
def my_question_subjects():
    if 'user_id' not in session:
        return jsonify([])
    questions = Question.query.filter_by(user_id=session['user_id']).all()
    seen = set()
    subjects = []
    for q in questions:
        sg = SubjectGrade.query.get(q.subject_grade_id)
        if sg and sg.subject and sg.subject.name not in seen:
            seen.add(sg.subject.name)
            subjects.append(sg.subject.name)
    return jsonify(subjects)


# LOGOUT
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('spa', page='home'))


# UPDATE PROFILE
@app.route('/api/profile', methods=['GET', 'POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'school': user.school or '',
            'class_level': user.class_level or '',
            'bio': user.bio or '',
            'good_at': [item.strip() for item in (user.good_at or '').split(',') if item.strip()],
            'need_help': [item.strip() for item in (user.need_help or '').split(',') if item.strip()]
        })

    data = request.get_json(silent=True) or {}
    user.school = (data.get('school') or '').strip()
    user.class_level = (data.get('class_level') or '').strip()
    user.bio = (data.get('bio') or '').strip()

    good_at = data.get('good_at') or []
    need_help = data.get('need_help') or []
    if isinstance(good_at, str):
        good_at = [item.strip() for item in good_at.split(',') if item.strip()]
    if isinstance(need_help, str):
        need_help = [item.strip() for item in need_help.split(',') if item.strip()]

    user.good_at = ','.join([item for item in good_at if item.strip()])
    user.need_help = ','.join([item for item in need_help if item.strip()])

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to save profile right now. Please try again.'}), 500

    return jsonify({'message': 'Profile updated successfully'})


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

    subject_count = Subject.query.count()
    student_count = User.query.filter_by(role='student').count()
    return render_template(
        'index.html',
        points=0,
        username=session.get('username', 'Guest'),
        auth_error=auth_error,
        active_page='auth',
        subject_count=subject_count,
        student_count=student_count
    )


# HOME PAGE
@app.route('/')
def home():
    # Reuse the same context as /home so recent activity is available on first load.
    return spa('home')


@app.route('/subject/<subject_name>/<grade>')
def subject_detail(subject_name, grade):
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
        email = user.email if user else ''
        school = user.school if user else ''
        class_level = user.class_level if user else ''
        bio = user.bio if user else ''
        good_at = user.good_at if user else ''
        need_help = user.need_help if user else ''
    else:
        points = 0
        username = 'Guest'
        email = ''
        school = ''
        class_level = ''
        bio = ''
        good_at = ''
        need_help = ''
    subject_count = Subject.query.count()
    student_count = User.query.filter_by(role='student').count()
    return render_template('index.html', points=points, username=username, subject_count=subject_count, student_count=student_count, email=email, school=school, class_level=class_level, bio=bio, good_at=good_at, need_help=need_help)


@app.route('/post/<int:question_id>')
def post_detail(question_id):
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        points = user.points if user else 0
        username = user.username if user else 'Guest'
        email = user.email if user else ''
        school = user.school if user else ''
        class_level = user.class_level if user else ''
        bio = user.bio if user else ''
        good_at = user.good_at if user else ''
        need_help = user.need_help if user else ''
    else:
        points = 0
        username = 'Guest'
        email = ''
        school = ''
        class_level = ''
        bio = ''
        good_at = ''
        need_help = ''
    subject_count = Subject.query.count()
    student_count = User.query.filter_by(role='student').count()
    return render_template('index.html', points=points, username=username, subject_count=subject_count, student_count=student_count, email=email, school=school, class_level=class_level, bio=bio, good_at=good_at, need_help=need_help)


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
        email = user.email if user else ''
        school = user.school if user else ''
        class_level = user.class_level if user else ''
        bio = user.bio if user else ''
        good_at = user.good_at if user else ''
        need_help = user.need_help if user else ''
        received = Rating.query.filter_by(to_user_id=user.id).all() if user else []
        rating_count = len(received)
        avg_rating = round(sum(r.value for r in received) / rating_count, 1) if rating_count else 0
    else:
        points = 0
        username = 'Guest'
        email = ''
        school = ''
        class_level = ''
        bio = ''
        good_at = ''
        need_help = ''
        avg_rating = 0
        rating_count = 0
    subject_count = Subject.query.count()
    student_count = User.query.filter_by(role='student').count()

    answers_summary = db.session.query(
        Answer.question_id.label('question_id'),
        func.max(Answer.created_at).label('latest_answer_at'),
        func.count(Answer.id).label('answers_count')
    ).group_by(Answer.question_id).subquery()

    raw_posts = db.session.query(
        Question,
        answers_summary.c.latest_answer_at,
        answers_summary.c.answers_count
    ).outerjoin(
        answers_summary,
        Question.id == answers_summary.c.question_id
    ).all()

    sortable_posts = []
    for question, latest_answer_at, answers_count in raw_posts:
        last_activity_at = latest_answer_at if latest_answer_at and latest_answer_at > question.created_at else question.created_at
        sortable_posts.append((question, answers_count or 0, last_activity_at))

    sortable_posts.sort(key=lambda item: item[2], reverse=True)
    recent_activity_posts = []
    for question, answers_count, _ in sortable_posts[:2]:
        subject_grade = SubjectGrade.query.get(question.subject_grade_id)
        author = User.query.get(question.user_id)
        recent_activity_posts.append({
            'id': question.id,
            'title': question.title,
            'answers_count': int(answers_count),
            'author': author.username if author else 'Unknown',
            'subject': subject_grade.subject.name if subject_grade and subject_grade.subject else 'Unknown',
            'grade': subject_grade.grade.name if subject_grade and subject_grade.grade else 'Unknown',
            'type': 'question'
        })

    top_helpers = []
    for u in User.query.filter(User.points > 0).order_by(User.points.desc()).limit(2).all():
        top_helpers.append({
            'username': u.username,
            'points': u.points or 0
        })

    return render_template(
        'index.html',
        points=points,
        username=username,
        subject_count=subject_count,
        student_count=student_count,
        email=email,
        school=school,
        class_level=class_level,
        bio=bio,
        good_at=good_at,
        need_help=need_help,
        avg_rating=avg_rating,
        rating_count=rating_count,
        recent_activity_posts=recent_activity_posts,
        top_helpers=top_helpers
    )