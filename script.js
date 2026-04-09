document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".nav a");

    const sections = {
        Home: document.getElementById("Home"),
        Search: document.getElementById("Search"),
        Profile: document.getElementById("Profile"),
        Forum: document.getElementById("Forum")
    };

    function setActive(link) {
        navLinks.forEach(a => a.classList.remove("active"));
        if (link) link.classList.add("active");
    }

    function showSection(sectionName) {
        Object.values(sections).forEach(sec => {
            if (sec) sec.classList.add("hidden");
        });

        if (sections[sectionName]) {
            sections[sectionName].classList.remove("hidden");
        }
    }

    function getSectionFromHash() {
        const hash = window.location.hash.toLowerCase();

        if (hash === "#search") return "Search";
        if (hash === "#profile") return "Profile";
        if (hash === "#forum") return "Forum";

        return "Home";
    }

    function setActiveBySection(sectionName) {
        const link = document.querySelector(`.nav a[data-page="${sectionName}"]`);
        setActive(link);
    }

    function goToSection(sectionName) {
        showSection(sectionName);
        setActiveBySection(sectionName);

        if (sectionName === "Home") {
            history.pushState(null, "", "index.html");
        } else {
            history.pushState(null, "", `#${sectionName.toLowerCase()}`);
        }
    }

    // click events
    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            const pageName = this.dataset.page;

            if (sections[pageName]) {
                event.preventDefault();
                goToSection(pageName);
            }
        });
    });

    // initial load
    goToSection(getSectionFromHash());

    // back/forward button
    window.addEventListener("popstate", function () {
        goToSection(getSectionFromHash());
    });

    // Search функционалност
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    if (searchForm && searchInput && searchResults) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const query = searchInput.value.trim();

            if (query.length > 0) {
                searchResults.innerHTML = `<p>Търсене за: <strong>${query}</strong></p>`;
            } else {
                searchResults.innerHTML = `<p>Въведете текст за търсене.</p>`;
            }
        });

        searchInput.addEventListener("input", function () {
            if (this.value.trim().length === 0) {
                searchResults.innerHTML = `<p>Enter text above and click Search to see your query.</p>`;
            }
        });
    }
});