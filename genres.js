/* =========================================================
   GENRE BROWSER (genres.html)
   Clicking a genre button loads its anime on this same page
   ========================================================= */

(function () {

    const buttons = document.querySelectorAll(".genre-button");
    const section = document.getElementById("genreResults");
    const title = document.getElementById("genreResultsTitle");
    const error = document.getElementById("genreError");
    const loading = document.getElementById("genreLoading");
    const results = document.getElementById("genreAnimeResults");
    const loadMore = document.getElementById("genreLoadMore");

    const API_URL = "https://graphql.anilist.co";

    let currentGenre = null;
    let currentPage = 1;
    let requestId = 0; // ignores slow responses from a genre that is no longer selected

    const query = `
        query ($genre: String, $page: Int) {
            Page(page: $page, perPage: 12) {
                pageInfo {
                    hasNextPage
                }

                media(genre: $genre, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        large
                    }

                    description
                    episodes
                    averageScore
                    type
                    format
                    status
                    genres
                }
            }
        }
    `;

    async function loadGenre() {

        const myRequest = requestId;

        error.textContent = "";
        loading.textContent = "Loading anime...";
        loadMore.hidden = true;

        try {

            const response = await fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({
                    query: query,
                    variables: { genre: currentGenre, page: currentPage }
                })
            });

            if (!response.ok) {
                throw new Error("API request failed.");
            }

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            if (myRequest !== requestId) {
                return;
            }

            loading.textContent = "";

            const animeList = result.data.Page.media;

            if (animeList.length === 0 && currentPage === 1) {
                error.textContent = "No anime found in this genre.";
                return;
            }

            animeList.forEach(function (anime) {
                results.appendChild(createAnimeCard(anime));
            });

            loadMore.hidden = !result.data.Page.pageInfo.hasNextPage;

        } catch (err) {

            if (myRequest !== requestId) {
                return;
            }

            loading.textContent = "";
            error.textContent = "Something went wrong. Please try again.";
            console.error("AniList Error:", err);
        }
    }

    function selectGenre(genre) {

        if (genre === currentGenre) {
            return;
        }

        requestId++;
        currentGenre = genre;
        currentPage = 1;

        results.innerHTML = "";
        title.textContent = "Popular " + genre + " Anime";
        section.hidden = false;

        buttons.forEach(function (button) {
            const active = button.dataset.genre === genre;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", active);
        });

        loadGenre();

        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", "false");

        button.addEventListener("click", function () {
            selectGenre(button.dataset.genre);
        });
    });

    loadMore.addEventListener("click", function () {
        currentPage++;
        loadGenre();
    });

})();
