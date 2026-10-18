/* =========================================================
   RECOMMENDATIONS CAROUSEL (index.html)
   Shows 5 currently trending anime and rotates automatically
   ========================================================= */

(function () {

    const section = document.getElementById("recommendations");
    const slidesBox = document.getElementById("recSlides");
    const dotsBox = document.getElementById("recDots");
    const prevButton = document.getElementById("recPrev");
    const nextButton = document.getElementById("recNext");

    const API_URL = "https://graphql.anilist.co";
    const ROTATE_MS = 5000;

    const query = `
        query {
            Page(page: 1, perPage: 5) {
                media(type: ANIME, isAdult: false, sort: TRENDING_DESC) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        extraLarge
                        large
                    }

                    bannerImage

                    description
                    episodes
                    averageScore
                    format
                    genres
                }
            }
        }
    `;

    let slides = [];
    let dots = [];
    let current = 0;
    let timer = null;
    let paused = false;

    function showSlide(index) {

        current = (index + slides.length) % slides.length;

        slides.forEach(function (slide, i) {
            const active = i === current;
            slide.classList.toggle("active", active);
            slide.setAttribute("aria-hidden", !active);
            slide.tabIndex = active ? 0 : -1;
        });

        dots.forEach(function (dot, i) {
            dot.classList.toggle("active", i === current);
            dot.setAttribute("aria-current", i === current);
        });
    }

    function startTimer() {

        stopTimer();

        timer = setInterval(function () {
            if (!paused) {
                showSlide(current + 1);
            }
        }, ROTATE_MS);
    }

    function stopTimer() {
        clearInterval(timer);
    }

    function goTo(index) {
        showSlide(index);
        startTimer();
    }

    function buildSlide(anime) {

        const title =
            anime.title.english ||
            anime.title.romaji ||
            anime.title.native ||
            "Unknown Title";

        let description = (anime.description || "No description available.")
            .replace(/<[^>]*>/g, "");

        if (description.length > 180) {
            description = description.substring(0, 180).trim() + "...";
        }

        const score = anime.averageScore ? anime.averageScore + "/100" : "N/A";
        const format = anime.format ? anime.format.replace(/_/g, " ") : "N/A";
        const genres = anime.genres.slice(0, 3).join(", ") || "N/A";

        const link = document.createElement("a");
        link.classList.add("rec-slide");
        link.href = "anime.html?id=" + anime.id;
        link.setAttribute("aria-label", title);

        const poster = anime.coverImage.extraLarge || anime.coverImage.large || "";
        const hasBanner = Boolean(anime.bannerImage);

        // Wide banner when the anime has one; otherwise a blurred
        // cover backdrop with the poster shown sharp on the left
        if (!hasBanner) {
            link.classList.add("no-banner");
        }

        link.innerHTML = `
            <img class="rec-bg" src="${encodeURI(hasBanner ? anime.bannerImage : poster)}" alt="">

            <div class="rec-overlay">

                ${hasBanner ? "" : `<img class="rec-poster" src="${encodeURI(poster)}" alt="${escapeHtml(title)}">`}

                <div class="rec-info">
                    <h4>${escapeHtml(title)}</h4>
                    <p class="rec-meta">${format} &bull; ${score} &bull; ${escapeHtml(genres)}</p>
                    <p class="rec-description">${escapeHtml(description)}</p>
                </div>

            </div>
        `;

        return link;
    }

    async function loadRecommendations() {

        try {

            const response = await fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({ query: query })
            });

            if (!response.ok) {
                throw new Error("API request failed.");
            }

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            const animeList = result.data.Page.media;

            if (animeList.length === 0) {
                return;
            }

            animeList.forEach(function (anime, i) {

                const slide = buildSlide(anime);
                slidesBox.appendChild(slide);
                slides.push(slide);

                const dot = document.createElement("button");
                dot.type = "button";
                dot.classList.add("rec-dot");
                dot.setAttribute("aria-label", "Show recommendation " + (i + 1));
                dot.addEventListener("click", function () {
                    goTo(i);
                });

                dotsBox.appendChild(dot);
                dots.push(dot);
            });

            section.hidden = false;
            showSlide(0);
            startTimer();

        } catch (error) {
            // Recommendations are optional, so the section simply stays hidden
            console.error("Recommendations Error:", error);
        }
    }

    prevButton.addEventListener("click", function () {
        goTo(current - 1);
    });

    nextButton.addEventListener("click", function () {
        goTo(current + 1);
    });

    // Pause while the person is pointing at or focused inside the carousel
    section.addEventListener("mouseenter", function () { paused = true; });
    section.addEventListener("mouseleave", function () { paused = false; });
    section.addEventListener("focusin", function () { paused = true; });
    section.addEventListener("focusout", function () { paused = false; });

    loadRecommendations();

})();
