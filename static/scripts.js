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
    const homeEditSubjectsLink = document.getElementById('homeEditSubjectsLink');
    const homeNeedHelpSubjectsList = document.getElementById('homeNeedHelpSubjectsList');
    const cardForum = document.querySelector('.card-forum');
    const subjectDetailSection = document.getElementById('SubjectDetail');
    let profileEditRequested = false;
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
        const isLoggedIn = document.body.dataset.loggedIn === 'true';
        subjects.forEach(subj => {
            const div = document.createElement('div');
            div.className = subj.name.toLowerCase().replace(/\s+/g, '');
            div.innerHTML = `
                <div class="subject_forum-header">
                    <h3> ${subj.name} </h3>
                    ${isLoggedIn ? `<button type="button" class="subject-add-level-btn" data-subject-name="${subj.name}">Add grade</button>` : ''}
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
            const msg = document.createElement('p');
            msg.className = 'empty-text';
            msg.textContent = 'No user found matching your search.';
            searchCards.appendChild(msg);
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
        if (!query) {
            renderSearchUsers(cachedUsers);
            return;
        }
        const filtered = cachedUsers.filter(user =>
            user.username.toLowerCase().includes(query)
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
                filterSearchUsers();
            })
            .catch(() => {
                searchCards.innerHTML = '<p class="empty-text">Unable to load users.</p>';
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
                                    <button class="reply-rate-btn" type="button" data-user-id="${answer.user_id}" data-username="${answer.user}">⭐ Rate</button>
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
        if (page === 'home') {
            refreshPointsFromDb();
            loadHomeNeedHelpSubjects();
        }
        if (page === 'forum') {
            loadForumSubjects();
        }
        if (page === 'profile') {
            // Reset profile and optionally enable edit mode
            if (profileInfoView) profileInfoView.style.display = 'block';
            if (profileInfoEdit) profileInfoEdit.style.display = 'none';
            if (profileEditBtn) profileEditBtn.textContent = 'Edit';
            refreshPointsFromDb();
            loadMyRatings();
            loadProfileData();
            setProfileEditMode(profileEditRequested);
            profileEditRequested = false;
        }
    }

    function getPageFromPath() {
        const path = window.location.pathname.replace(/^\//, '');
        return path || 'home';
    }

    function navigateTo(page, options = {}) {
        if (options.edit) {
            profileEditRequested = true;
        }
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

    if (homeEditSubjectsLink) {
        homeEditSubjectsLink.addEventListener('click', function(event) {
            event.preventDefault();
            navigateTo('profile', { edit: true });
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

    // Profile editing functionality
    const profileEditBtn = document.getElementById('profileEditBtn');
    const profileInfoView = document.getElementById('profileInfoView');
    const goodAtInput = document.getElementById('goodAtInput');
    const addGoodAtBtn = document.getElementById('addGoodAtBtn');
    const goodAtTagsContainer = document.getElementById('goodAtTagsContainer');
    const needHelpInput = document.getElementById('needHelpInput');
    const addNeedHelpBtn = document.getElementById('addNeedHelpBtn');
    const needHelpTagsContainer = document.getElementById('needHelpTagsContainer');
    const goodAtSubjectsList = document.getElementById('goodAtSubjectsList');
    const needHelpSubjectsList = document.getElementById('needHelpSubjectsList');
    let goodAtTags = [];
    let needHelpTags = [];

    async function refreshPointsFromDb() {
        if (document.body.dataset.loggedIn !== 'true') return;
        try {
            const response = await fetch('/api/me-summary', { credentials: 'same-origin' });
            if (!response.ok) return;
            const data = await response.json();
            const points = typeof data.points === 'number' ? data.points : 0;

            const headerPoints = document.getElementById('pts-header');
            const homePoints = document.getElementById('pts-num');
            const profilePoints = document.getElementById('profilePoints');

            if (headerPoints) headerPoints.textContent = String(points);
            if (homePoints) homePoints.textContent = String(points);
            if (profilePoints) profilePoints.textContent = String(points);
        } catch (e) {
            // Ignore transient network errors and keep server-rendered values.
        }
    }

    // Render saved profile subject lists in both view and edit mode
    function renderTagList(container, tags, allowRemove = false) {
        if (!container) return;
        if (!Array.isArray(tags) || !tags.length) {
            container.innerHTML = '<p class="empty-text">No subjects yet</p>';
            return;
        }
        container.innerHTML = tags.map((tag, index) => {
            const safeText = String(tag || '').trim();
            if (!safeText) return '';
            const colorClass = `color-${(index % 6) + 1}`;
            if (allowRemove) {
                return `<span class="profile-tag-pill ${colorClass}">${safeText}<span class="remove-tag" data-tag="${safeText}" data-type="${container.id}">×</span></span>`;
            }
            return `<span class="profile-tag-pill ${colorClass}">${safeText}</span>`;
        }).join('');
    }

    function renderProfileSubjects() {
        if (goodAtSubjectsList) {
            renderTagList(goodAtSubjectsList, goodAtTags, false);
        }
        if (needHelpSubjectsList) {
            renderTagList(needHelpSubjectsList, needHelpTags, false);
        }
        if (goodAtTagsContainer) {
            renderTagList(goodAtTagsContainer, goodAtTags, true);
        }
        if (needHelpTagsContainer) {
            renderTagList(needHelpTagsContainer, needHelpTags, true);
        }
    }

    async function loadHomeNeedHelpSubjects() {
        if (!homeNeedHelpSubjectsList || document.body.dataset.loggedIn !== 'true') return;
        try {
            const response = await fetch('/api/profile', { credentials: 'same-origin' });
            if (!response.ok) return;
            const data = await response.json();
            const tags = Array.isArray(data.need_help) ? data.need_help : (data.need_help ? String(data.need_help).split(',').map(s => s.trim()).filter(Boolean) : []);
            renderTagList(homeNeedHelpSubjectsList, tags, false);
        } catch {
            // ignore home profile load failures
        }
    }

    async function loadProfileData() {
        if (document.body.dataset.loggedIn !== 'true') return;
        try {
            const response = await fetch('/api/profile', { credentials: 'same-origin' });
            if (!response.ok) return;
            const data = await response.json();
            goodAtTags = Array.isArray(data.good_at) ? data.good_at : (data.good_at ? String(data.good_at).split(',').map(s => s.trim()).filter(Boolean) : []);
            needHelpTags = Array.isArray(data.need_help) ? data.need_help : (data.need_help ? String(data.need_help).split(',').map(s => s.trim()).filter(Boolean) : []);

            if (goodAtInput) goodAtInput.value = '';
            if (needHelpInput) needHelpInput.value = '';

            if (document.getElementById('viewSchool')) document.getElementById('viewSchool').textContent = data.school || 'Not specified';
            if (document.getElementById('viewClass')) document.getElementById('viewClass').textContent = data.class_level || 'Not specified';
            if (document.getElementById('viewBio')) document.getElementById('viewBio').textContent = data.bio || 'No bio added';

            renderProfileSubjects();
        } catch {
            // ignore profile load failures
        }
    }

    function addProfileTag(tag, targetList) {
        const normalized = String(tag || '').trim();
        if (!normalized) return;
        if (targetList === 'goodAt') {
            if (!goodAtTags.includes(normalized)) {
                goodAtTags.push(normalized);
            }
        } else if (targetList === 'needHelp') {
            if (!needHelpTags.includes(normalized)) {
                needHelpTags.push(normalized);
            }
        }
        renderProfileSubjects();
    }

    function removeProfileTag(tag, targetList) {
        const normalized = String(tag || '').trim();
        if (targetList === 'goodAt') {
            goodAtTags = goodAtTags.filter(item => item !== normalized);
        } else if (targetList === 'needHelp') {
            needHelpTags = needHelpTags.filter(item => item !== normalized);
        }
        renderProfileSubjects();
    }

    // Load and render "Your Ratings"
    async function loadMyRatings() {
        const header = document.getElementById('ratingsBoxHeader');
        const list = document.getElementById('ratingsBoxList');
        if (!list) return;
        try {
            const res = await fetch('/api/my-ratings', { credentials: 'same-origin' });
            if (!res.ok) { list.innerHTML = '<p class="empty-text">No ratings yet</p>'; return; }
            const ratings = await res.json();
            if (!ratings.length) {
                list.innerHTML = '<p class="empty-text">No ratings yet</p>';
                if (header) header.textContent = '⭐ Your Ratings';
                return;
            }
            const avg = (ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1);
            if (header) header.textContent = `⭐ Your Ratings (avg: ${avg} ★ from ${ratings.length} rating${ratings.length !== 1 ? 's' : ''})`;
            list.innerHTML = ratings.map(r => {
                const filled = '★'.repeat(r.value);
                const empty = '☆'.repeat(5 - r.value);
                const subjectChip = r.subject ? `<span class="rating-subject-chip">${r.subject}</span>` : '';
                const comment = r.comment ? `<p class="rating-comment">${r.comment}</p>` : '';
                return `<div class="rating-row">
                    <div class="rating-row-top">
                        <span class="rating-stars-filled">${filled}</span><span class="rating-stars-empty">${empty}</span>
                        ${subjectChip}
                    </div>
                    ${comment}
                    <p class="rating-from">— ${r.from_username}</p>
                </div>`;
            }).join('');
        } catch {
            list.innerHTML = '<p class="empty-text">No ratings yet</p>';
        }
    }
    const profileInfoEdit = document.getElementById('profileInfoEdit');
    let profileIsEditing = false;

    function setProfileEditMode(isEditing) {
        profileIsEditing = isEditing;
        if (profileInfoView) {
            profileInfoView.style.display = isEditing ? 'none' : 'block';
        }
        if (profileInfoEdit) {
            profileInfoEdit.style.display = isEditing ? 'block' : 'none';
        }
        document.querySelectorAll('.edit-only').forEach(el => {
            el.style.display = isEditing ? 'block' : 'none';
        });
        if (profileEditBtn) {
            profileEditBtn.textContent = isEditing ? 'Save' : 'Edit';
        }
    }

    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', async () => {
            if (document.body.dataset.loggedIn !== 'true') {
                alert('Please sign in to edit your profile.');
                navigateTo('auth');
                return;
            }

            if (!profileIsEditing) {
                loadProfileData();
                setProfileEditMode(true);
                return;
            }

            const school = document.getElementById('editSchool').value.trim();
            const classLevel = document.getElementById('editClass').value.trim();
            const bio = document.getElementById('editBio').value.trim();

            try {
                const response = await fetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        school,
                        class_level: classLevel,
                        bio,
                        good_at: goodAtTags,
                        need_help: needHelpTags
                    })
                });

                if (!response.ok) {
                    let errorMessage = 'Error saving profile';
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.error) {
                            errorMessage = errorData.error;
                        }
                    } catch (e) {
                        // Keep default message when response body is not JSON.
                    }
                    alert(errorMessage);
                    if (response.status === 401) {
                        navigateTo('auth');
                    }
                    return;
                }

                document.getElementById('viewSchool').textContent = school || 'Not specified';
                document.getElementById('viewClass').textContent = classLevel || 'Not specified';
                document.getElementById('viewBio').textContent = bio || 'No bio added';
                renderProfileSubjects();
                setProfileEditMode(false);
            } catch (err) {
                alert('Unable to save profile');
            }
        });
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
            if (document.body.dataset.loggedIn !== 'true') {
                sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'reply', questionId: currentQuestionId, content }));
                navigateTo('auth');
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
            if (document.body.dataset.loggedIn !== 'true') {
                sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'newPost', subject: currentDetailSubject, grade: currentDetailGrade }));
                navigateTo('auth');
                return;
            }
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

    // ── Rate Modal ──────────────────────────────────────────────
    const rateModal = document.getElementById('rateModal');
    const rateModalTitle = document.getElementById('rateModalTitle');
    const rateStarsContainer = document.getElementById('rateStars');
    const rateSubjectInput = document.getElementById('rateSubjectInput');
    const rateCommentInput = document.getElementById('rateCommentInput');
    const rateModalClose = document.querySelector('.rate-modal-close');
    const rateModalCancel = document.querySelector('.rate-modal-cancel');
    const rateModalSubmit = document.querySelector('.rate-modal-submit');
    let rateTargetUserId = null;
    let rateSelectedValue = 0;

    function openRateModal(userId, username) {
        if (!rateModal) return;
        rateTargetUserId = userId;
        rateSelectedValue = 0;
        if (rateModalTitle) rateModalTitle.textContent = `Rate ${username}`;
        if (rateSubjectInput) rateSubjectInput.value = currentDetailSubject || '';
        if (rateCommentInput) rateCommentInput.value = '';
        // Reset stars
        if (rateStarsContainer) {
            rateStarsContainer.querySelectorAll('.star').forEach(s => s.textContent = '☆');
        }
        rateModal.style.display = 'flex';
    }

    function closeRateModal() {
        if (rateModal) rateModal.style.display = 'none';
        rateTargetUserId = null;
        rateSelectedValue = 0;
    }

    if (rateStarsContainer) {
        rateStarsContainer.addEventListener('click', (e) => {
            const star = e.target.closest('.star');
            if (!star) return;
            rateSelectedValue = parseInt(star.dataset.value, 10);
            rateStarsContainer.querySelectorAll('.star').forEach(s => {
                s.textContent = parseInt(s.dataset.value, 10) <= rateSelectedValue ? '★' : '☆';
            });
        });
        rateStarsContainer.addEventListener('mouseover', (e) => {
            const star = e.target.closest('.star');
            if (!star) return;
            const hovered = parseInt(star.dataset.value, 10);
            rateStarsContainer.querySelectorAll('.star').forEach(s => {
                s.textContent = parseInt(s.dataset.value, 10) <= hovered ? '★' : '☆';
            });
        });
        rateStarsContainer.addEventListener('mouseleave', () => {
            rateStarsContainer.querySelectorAll('.star').forEach(s => {
                s.textContent = parseInt(s.dataset.value, 10) <= rateSelectedValue ? '★' : '☆';
            });
        });
    }

    if (rateModalClose) rateModalClose.addEventListener('click', closeRateModal);
    if (rateModalCancel) rateModalCancel.addEventListener('click', closeRateModal);
    if (rateModal) {
        rateModal.addEventListener('click', (e) => {
            if (e.target === rateModal) closeRateModal();
        });
    }

    if (rateModalSubmit) {
        rateModalSubmit.addEventListener('click', async () => {
            if (!rateTargetUserId) return;
            if (!rateSelectedValue) {
                alert('Please select a star rating.');
                return;
            }
            if (document.body.dataset.loggedIn !== 'true') {
                alert('Please sign in to rate users.');
                navigateTo('auth');
                return;
            }
            try {
                const response = await fetch('/rate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        to_user_id: rateTargetUserId,
                        value: rateSelectedValue,
                        subject: (document.getElementById('rateSubjectInput') || {}).value || '',
                        comment: (document.getElementById('rateCommentInput') || {}).value || ''
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    alert(data.error || 'Unable to submit rating.');
                    return;
                }
                closeRateModal();
                alert('Rating submitted!');
            } catch (err) {
                alert('Unable to connect to the server.');
            }
        });
    }

    // Open rate modal from reply cards (event delegation on replyList)
    if (replyList) {
        replyList.addEventListener('click', (e) => {
            const btn = e.target.closest('.reply-rate-btn');
            if (!btn) return;
            const userId = btn.dataset.userId;
            const username = btn.dataset.username || 'user';
            if (!userId) return;
            openRateModal(userId, username);
        });
    }
    // ── End Rate Modal ───────────────────────────────────────────

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

    if (addGoodAtBtn) {
        addGoodAtBtn.addEventListener('click', () => {
            addProfileTag(goodAtInput.value, 'goodAt');
            if (goodAtInput) goodAtInput.value = '';
        });
    }

    if (addNeedHelpBtn) {
        addNeedHelpBtn.addEventListener('click', () => {
            addProfileTag(needHelpInput.value, 'needHelp');
            if (needHelpInput) needHelpInput.value = '';
        });
    }

    const tagEditorClickHandler = (event) => {
        const remove = event.target.closest('.remove-tag');
        if (!remove) return;
        const tagText = remove.dataset.tag;
        const targetContainer = remove.dataset.type;
        if (tagText && targetContainer === 'goodAtTagsContainer') {
            removeProfileTag(tagText, 'goodAt');
        }
        if (tagText && targetContainer === 'needHelpTagsContainer') {
            removeProfileTag(tagText, 'needHelp');
        }
    };

    if (goodAtTagsContainer) {
        goodAtTagsContainer.addEventListener('click', tagEditorClickHandler);
    }

    if (needHelpTagsContainer) {
        needHelpTagsContainer.addEventListener('click', tagEditorClickHandler);
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

    async function submitReply(questionId, content) {
        try {
            const response = await fetch('/answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_id: questionId, content })
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || 'Unable to send reply.');
                return;
            }
            openPostDetail(questionId, true);
        } catch (err) {
            alert('Unable to connect to the server.');
        }
    }

    const pendingActionStr = sessionStorage.getItem('pendingAction');
    if (document.body.dataset.loggedIn === 'true' && pendingActionStr) {
        sessionStorage.removeItem('pendingAction');
        try {
            const pending = JSON.parse(pendingActionStr);
            if (pending.type === 'newPost' && pending.subject && pending.grade) {
                openSubjectDetail(pending.subject, pending.grade);
                openNewPostModal();
            } else if (pending.type === 'reply' && pending.questionId) {
                openPostDetail(pending.questionId).then(() => {
                    submitReply(pending.questionId, pending.content);
                });
            }
        } catch (e) {
            // ignore malformed pending action
        }
    }

    window.addEventListener('popstate', function() {
        showPage(getPageFromPath());
    });

    showPage(getPageFromPath());
});