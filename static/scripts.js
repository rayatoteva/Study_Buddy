document.addEventListener('DOMContentLoaded', function() {
    const sections = {
        home: document.getElementById('Home'),
        forum: document.getElementById('Forum'),
        subjectDetail: document.getElementById('SubjectDetail'),
        postDetail: document.getElementById('PostDetail'),
        search: document.getElementById('Search'),
        profile: document.getElementById('Profile'),
        chat: document.getElementById('Chat'),
        auth: document.getElementById('Auth')
    };

    const navLinks = document.querySelectorAll('nav.nav a');
    const authTrigger = document.querySelector('a[href="/auth"]');
    const goToRegisterBtn = document.getElementById('goToRegisterBtn');
    const backToLogin = document.getElementById('backToLogin');
    const forgotPassBtn = document.getElementById('forgotPassBtn');
    const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const searchInput = document.getElementById('searchInput');
    const searchCards = document.getElementById('searchCards');
    const searchEmpty = document.getElementById('searchEmpty');
    const addSubjectModal = document.getElementById('addSubjectModal');
    const forumBtn = document.querySelector('.forum-btn');
    const closeBtn = document.querySelector('.close-btn');
    const addClassBtn = document.getElementById('addClassBtn');
    const classLevelInput = document.getElementById('classLevelInput');
    const tagsContainer = document.getElementById('tagsContainer');
    const addSubjectForm = document.querySelector('#addSubjectModal form');
    const gradesInput = document.getElementById('gradesInput');
    const subjectNameInput = document.getElementById('subjectNameInput');
    const addSubjectHeader = document.querySelector('#addSubjectModal .modal-content h2');
    const addSubjectSubmitButton = document.querySelector('.add-subject-submit');
    const subjectMessage = document.getElementById('subjectMessage');
    const cardForum = document.querySelector('.card-forum');
    const subjectDetailSection = document.getElementById('SubjectDetail');
    const detailSubjectName = document.getElementById('detailSubjectName');
    const detailGradeName = document.getElementById('detailGradeName');
    const detailPostList = document.getElementById('detailPostList');
    const subjectBackButton = document.querySelector('.back-to-forum');
    const postDetailSection = document.getElementById('PostDetail');
    const postDetailTitle = document.getElementById('postDetailTitle');
    const postDetailBadge = document.getElementById('postDetailBadge');
    const postDetailMeta = document.getElementById('postDetailMeta');
    const postDetailContent = document.getElementById('postDetailContent');
    const postRepliesCount = document.getElementById('postRepliesCount');
    const replyList = document.getElementById('replyList');
    const postBackButton = document.querySelector('.post-back-btn');
    const postReplyForm = document.getElementById('postReplyForm');
    const newPostButton = document.querySelector('.new-post-btn');
    const newPostModal = document.getElementById('newPostModal');
    const newPostForm = document.getElementById('newPostForm');
    const modalCloseButton = document.querySelector('.modal-close');
    const modalCancelButton = document.querySelector('.modal-cancel');

    let cachedUsers = [];
    let currentDetailSubject = '';
    let currentDetailGrade = '';
    let currentQuestionId = null;

    function hideAllSections() {
        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });
    }

    function setActiveLink(page) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
    }

    function renderForumSubjects(subjects) {
        if (!cardForum) return;
        cardForum.innerHTML = '';
        subjects.forEach(subj => {
            const div = document.createElement('div');
            div.className = subj.name.toLowerCase().replace(/\s+/g, '');
            div.innerHTML = `
                <div class="subject_forum-header">
                    <h3> ${subj.name} </h3>
                    <button type="button" class="subject-add-level-btn" data-subject-name="${subj.name}">Add grade</button>
                </div>
                <span> CLASSES </span>
                <div class="grades">
                    ${subj.grades.map(grade => `<a href="#" class="grade-link" data-subject-name="${subj.name}" data-grade-name="${grade}">${grade}</a>`).join('')}
                </div>
            `;
            cardForum.appendChild(div);
        });
    }

    function loadForumSubjects() {
        fetch('/api/subjects')
            .then(response => response.json())
            .then(data => {
                renderForumSubjects(data);
            })
            .catch(() => {
                // Handle error, maybe show message
            });
    }

    function hideAllSections() {
        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });
    }

    function setActiveLink(page) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
    }

    function renderSearchUsers(users) {
        if (!searchCards) return;
        searchCards.innerHTML = '';

        if (!users.length) {
            if (searchEmpty) {
                searchEmpty.textContent = 'No users found.';
                searchCards.appendChild(searchEmpty);
            }
            return;
        }

        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'search-card';
            card.innerHTML = `
                <div class="search-card-header">
                    <div class="avatar avatar-${user.username.charAt(0).toLowerCase()}">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="search-header-info">
                        <div>
                            <a href="/profile"> ${user.username} </a>
                            <span class="search-header-pf"> ${user.rating.toFixed(1)} </span>
                        </div>
                        <p> Student </p>
                        <span class="nivo"> Novice </span>
                    </div>
                </div>
                <div class="search-card-body">
                    <button class="button"> Send friend request </button>
                    <button class="button"> Rate </button>
                </div>
            `;
            searchCards.appendChild(card);
        });
    }

    function filterSearchUsers() {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        const filtered = cachedUsers.filter(user =>
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
        renderSearchUsers(filtered);
    }

    function loadSearchUsers() {
        if (!searchCards) return;
        if (cachedUsers.length) {
            filterSearchUsers();
            return;
        }

        fetch('/api/users')
            .then(response => response.json())
            .then(data => {
                cachedUsers = data;
                if (searchEmpty) {
                    searchEmpty.textContent = '';
                }
                renderSearchUsers(cachedUsers);
            })
            .catch(() => {
                if (searchEmpty) {
                    searchEmpty.textContent = 'Unable to load users.';
                    searchCards.appendChild(searchEmpty);
                }
            });
    }

    function openSubjectDetail(subjectName, gradeName, skipHistory = false) {
        currentDetailSubject = subjectName || '';
        currentDetailGrade = gradeName || '';
        currentQuestionId = null;

        if (detailSubjectName) detailSubjectName.textContent = subjectName || 'Subject';
        if (detailGradeName) detailGradeName.textContent = gradeName || 'Grade';

        hideAllSections();
        if (subjectDetailSection) subjectDetailSection.style.display = 'block';
        setActiveLink('');

        if (detailPostList) {
            detailPostList.innerHTML = `
                <div class="detail-post-card">
                    <div class="detail-post-title">${subjectName} – ${gradeName}</div>
                    <div class="detail-post-text">Loading posts...</div>
                </div>
            `;
        }

        loadGradePosts(subjectName, gradeName);

        if (!skipHistory) {
            window.history.pushState({ page: 'subjectDetail', subjectName, gradeName }, '', `/subject/${encodeURIComponent(subjectName)}/${encodeURIComponent(gradeName)}`);
        }
    }

    async function openPostDetail(questionId, skipHistory = false) {
        currentQuestionId = questionId;
        hideAllSections();
        if (postDetailSection) postDetailSection.style.display = 'block';
        setActiveLink('');

        if (postDetailTitle) postDetailTitle.textContent = 'Loading...';
        if (postDetailBadge) postDetailBadge.textContent = '';
        if (postDetailMeta) postDetailMeta.textContent = '';
        if (postDetailContent) postDetailContent.textContent = '';
        if (postRepliesCount) postRepliesCount.textContent = '';

        try {
            const response = await fetch(`/questions/${encodeURIComponent(questionId)}`);
            if (!response.ok) throw new Error('Unable to load post');
            const post = await response.json();

            if (postDetailTitle) postDetailTitle.textContent = post.title || 'Post';
            if (postDetailBadge) postDetailBadge.textContent = post.type || 'Question';
            if (postDetailMeta) postDetailMeta.textContent = `${post.user} · ${post.subject} · ${post.grade} · ${post.created_at}`;
            if (postDetailContent) postDetailContent.textContent = post.content || '';
            if (postRepliesCount) postRepliesCount.textContent = `${post.answers_count || 0} Replies`;
            if (replyList) {
                replyList.innerHTML = post.answers && post.answers.length ?
                    post.answers.map(answer => `
                        <div class="reply-card">
                            <div class="reply-avatar">${answer.user.charAt(0).toUpperCase()}</div>
                            <div class="reply-body">
                                <div class="reply-head">
                                    <span class="reply-author">${answer.user}</span>
                                    <span class="reply-time">${answer.created_at}</span>
                                    <button class="reply-rate-btn" type="button">⭐ Rate</button>
                                </div>
                                <div class="reply-text">${answer.content}</div>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="reply-empty">No replies yet. Be the first to help!</div>';
            }

            if (!skipHistory) {
                window.history.pushState({ page: 'postDetail', questionId }, '', `/post/${encodeURIComponent(questionId)}`);
            }
        } catch (error) {
            if (postDetailTitle) postDetailTitle.textContent = 'Unable to load post';
            if (postDetailContent) postDetailContent.textContent = 'Please try again later.';
        }
    }

    async function loadGradePosts(subjectName, gradeName) {
        if (!subjectName || !gradeName || !detailPostList) return;
        try {
            const response = await fetch(`/questions?subject=${encodeURIComponent(subjectName)}&grade=${encodeURIComponent(gradeName)}`);
            if (!response.ok) throw new Error('Unable to load posts');
            const posts = await response.json();
            if (!posts.length) {
                detailPostList.innerHTML = `
                    <div class="detail-post-card">
                        <div class="detail-post-title">No posts yet</div>
                        <div class="detail-post-text">Create the first post for ${subjectName} — ${gradeName}.</div>
                    </div>
                `;
                return;
            }
            detailPostList.innerHTML = posts.map(post => `
                <div class="detail-post-card clickable-post" data-post-id="${post.id}">
                    <div class="detail-post-title">${post.title}</div>
                    <div class="detail-post-meta">${post.user} · ${post.created_at}</div>
                    <div class="detail-post-text">${post.content}</div>
                </div>
            `).join('');
        } catch (error) {
            detailPostList.innerHTML = `
                <div class="detail-post-card">
                    <div class="detail-post-title">Unable to load posts</div>
                    <div class="detail-post-text">Please try again later.</div>
                </div>
            `;
        }
    }

    function openNewPostModal() {
        if (!newPostModal) return;
        if (newPostModal) newPostModal.style.display = 'flex';
    }

    function closeNewPostModal() {
        if (!newPostModal) return;
        newPostModal.style.display = 'none';
        if (newPostForm) newPostForm.reset();
    }

    function showPage(page) {
        if (!page) page = 'home';
        if (page.startsWith('subject/')) {
            const parts = page.split('/');
            const subjectName = decodeURIComponent(parts[1] || '');
            const gradeName = decodeURIComponent(parts[2] || '');
            openSubjectDetail(subjectName, gradeName, true);
            return;
        }

        if (page.startsWith('post/')) {
            const parts = page.split('/');
            const questionId = parts[1] || '';
            if (questionId) {
                openPostDetail(questionId, true);
                return;
            }
        }

        hideAllSections();
        const section = sections[page] || sections.home;
        if (section) section.style.display = 'block';
        if (page === 'auth') {
            setActiveLink('');
        } else {
            setActiveLink(page);
        }
        resetAuthForms();
        if (page === 'search') {
            loadSearchUsers();
        }
        if (page === 'forum') {
            loadForumSubjects();
        }
    }

    function getPageFromPath() {
        const path = window.location.pathname.replace(/^\//, '');
        return path || 'home';
    }

    function navigateTo(page) {
        const url = page === 'home' ? '/' : `/${page}`;
        window.history.pushState({ page }, '', url);
        showPage(page);
    }

    function resetAuthForms() {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (forgotForm) forgotForm.style.display = 'none';
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = link.dataset.page || 'home';
            navigateTo(page);
        });
    });

    if (authTrigger) {
        authTrigger.addEventListener('click', function(event) {
            event.preventDefault();
            navigateTo('auth');
        });
    }

    if (goToRegisterBtn) {
        goToRegisterBtn.addEventListener('click', function() {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            if (forgotForm) forgotForm.style.display = 'none';
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', function() {
            resetAuthForms();
        });
    }

    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', function() {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'block';
        });
    }

    if (backToLoginFromForgot) {
        backToLoginFromForgot.addEventListener('click', function() {
            resetAuthForms();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterSearchUsers);
    }

    function openAddSubjectModal(subjectName = '') {
        if (!addSubjectModal) return;

        if (subjectName) {
            if (subjectNameInput) {
                subjectNameInput.value = subjectName;
                subjectNameInput.readOnly = true;
            }
            if (addSubjectHeader) addSubjectHeader.textContent = `Add level to ${subjectName}`;
            if (addSubjectSubmitButton) addSubjectSubmitButton.textContent = 'Add Level';
        } else {
            if (subjectNameInput) {
                subjectNameInput.value = '';
                subjectNameInput.readOnly = false;
            }
            if (addSubjectHeader) addSubjectHeader.textContent = 'Add New Subject';
            if (addSubjectSubmitButton) addSubjectSubmitButton.textContent = 'Add Subject';
        }

        if (tagsContainer) tagsContainer.innerHTML = '';
        setSubjectMessage('');
        addSubjectModal.style.display = 'block';
    }

    if (forumBtn) {
        forumBtn.addEventListener('click', () => {
            openAddSubjectModal();
        });
    }

    if (cardForum) {
        cardForum.addEventListener('click', (event) => {
            const button = event.target.closest('.subject-add-level-btn');
            if (button) {
                const subjectName = button.dataset.subjectName || '';
                openAddSubjectModal(subjectName);
                return;
            }
            const gradeLink = event.target.closest('.grade-link');
            if (gradeLink) {
                event.preventDefault();
                openSubjectDetail(gradeLink.dataset.subjectName || '', gradeLink.dataset.gradeName || '');
                return;
            }
        });
    }

    if (detailPostList) {
        detailPostList.addEventListener('click', (event) => {
            const card = event.target.closest('.detail-post-card.clickable-post');
            if (!card) return;
            const questionId = card.dataset.postId;
            if (questionId) openPostDetail(questionId);
        });
    }

    if (subjectBackButton) {
        subjectBackButton.addEventListener('click', () => {
            navigateTo('forum');
        });
    }

    if (postBackButton) {
        postBackButton.addEventListener('click', () => {
            navigateTo('forum');
        });
    }

    if (postReplyForm) {
        postReplyForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!currentQuestionId) {
                alert('Unable to send reply.');
                return;
            }
            const formData = new FormData(postReplyForm);
            const content = (formData.get('reply') || '').trim();
            if (!content) {
                alert('Please write a reply.');
                return;
            }
            try {
                const response = await fetch('/answers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question_id: currentQuestionId,
                        content
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.error || 'Unable to send reply.');
                    return;
                }
                postReplyForm.reset();
                openPostDetail(currentQuestionId, true);
            } catch (err) {
                alert('Unable to connect to the server.');
            }
        });
    }

    if (newPostButton) {
        newPostButton.addEventListener('click', () => {
            openNewPostModal();
        });
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeNewPostModal);
    }

    if (modalCancelButton) {
        modalCancelButton.addEventListener('click', closeNewPostModal);
    }

    if (newPostForm) {
        newPostForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(newPostForm);
            const postType = formData.get('post_type');
            const title = formData.get('title').trim();
            const content = formData.get('content').trim();

            if (!currentDetailSubject || !currentDetailGrade) {
                alert('Open a subject grade before posting.');
                return;
            }
            if (!title || !content) {
                alert('Please enter title and content.');
                return;
            }

            try {
                const response = await fetch('/questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subject: currentDetailSubject,
                        grade: currentDetailGrade,
                        title,
                        content,
                        post_type: postType
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.error || 'Unable to create post.');
                    return;
                }
                closeNewPostModal();
                await loadGradePosts(currentDetailSubject, currentDetailGrade);
            } catch (err) {
                alert('Unable to connect to the server.');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (addSubjectModal) addSubjectModal.style.display = 'none';
        });
    }

    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => {
            const value = classLevelInput.value.trim();
            if (value) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = value;
                const removeBtn = document.createElement('span');
                removeBtn.textContent = ' ×';
                removeBtn.style.cursor = 'pointer';
                removeBtn.addEventListener('click', () => {
                    tagsContainer.removeChild(tag);
                });
                tag.appendChild(removeBtn);
                tagsContainer.appendChild(tag);
                classLevelInput.value = '';
            }
        });
    }

    function setSubjectMessage(text, type = 'error') {
        if (!subjectMessage) return;
        subjectMessage.textContent = text;
        subjectMessage.className = `form-message ${type}`;
    }

    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const grades = Array.from(tagsContainer.children).map(tag => tag.textContent.replace(' ×', '').trim()).filter(Boolean);
            if (!grades.length) {
                setSubjectMessage('Please add at least one class level.', 'error');
                return;
            }

            const formData = new URLSearchParams(new FormData(addSubjectForm));
            formData.set('grades', grades.join(','));

            try {
                const response = await fetch('/add_subject', {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });
                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    setSubjectMessage(data.message || 'Subject added successfully.', 'success');
                    loadForumSubjects();
                    tagsContainer.innerHTML = '';
                    addSubjectForm.reset();
                    if (gradesInput) gradesInput.value = '';
                    setTimeout(() => {
                        if (addSubjectModal) addSubjectModal.style.display = 'none';
                        setSubjectMessage('');
                    }, 1000);
                } else {
                    setSubjectMessage(data.message || 'An error occurred while adding.', 'error');
                }
            } catch (error) {
                setSubjectMessage('Unable to connect to the server.', 'error');
            }
        });
    }

    window.addEventListener('popstate', function() {
        showPage(getPageFromPath());
    });

    showPage(getPageFromPath());
});