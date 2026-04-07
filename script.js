document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".nav a");
    const sections = {
        Home: document.getElementById("Home"),
        Search: document.getElementById("Search"),
        Profile: document.getElementById("Profile")
    };

    function setActive(link) {
        navLinks.forEach(a => a.classList.remove("active"));
        if (link) {
            link.classList.add("active");
        }
    }

    function setActiveByPage(pageName) {
        const activeLink = document.querySelector(`.nav a[data-page="${pageName}"]`);
        setActive(activeLink);
    }

    function showSection(sectionName) {
        Object.values(sections).forEach(sec => {
            if (sec) sec.classList.add("hidden");
        });

        if (sections[sectionName]) {
            sections[sectionName].classList.remove("hidden");
        }
    }

    function getCurrentPageName() {
        const fileName = window.location.pathname.split("/").pop().toLowerCase();
        if (fileName === "forum.html") return "Forum";
        return "Home";
    }

    function getPageNameFromHash() {
        const hash = window.location.hash.toLowerCase();
        if (hash === "#search") return "Search";
        if (hash === "#profile") return "Profile";
        return "Home";
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            const pageName = this.dataset.page;
            setActive(this);
            if (pageName === "Search" || pageName === "Profile") {
                if (getCurrentPageName() === "Home") {
                    event.preventDefault();
                    showSection(pageName);
                }
            }
        });
    });

    const activePage = getCurrentPageName();
    setActiveByPage(activePage);

    if (activePage === "Home") {
        showSection(getPageNameFromHash());
    }
});
