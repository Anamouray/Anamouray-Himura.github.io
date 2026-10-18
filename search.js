const animeInput = document.getElementById("animeInput");
const searchButton = document.getElementById("searchButton");
const animeResults = document.getElementById("animeResults");
const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");
const loadMoreButton = document.getElementById("loadMoreButton");
const resultsTitle = document.getElementById("resultsTitle");

const API_URL = "https://graphql.anilist.co";

const searchTerm = (
    new URLSearchParams(window.location.search).get("q") || ""
).trim();

let currentPage = 1;

const query = `
    query ($search: String, $page: Int) {
        Page(page: $page, perPage: 12) {
            pageInfo {
                hasNextPage
            }

            media(search: $search, type: ANIME, isAdult: false) {
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

async function loadResults() {

    errorMessage.textContent = "";
    loadingMessage.textContent = "Searching for anime...";
    loadMoreButton.hidden = true;

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                query: query,
                variables: { search: searchTerm, page: currentPage }
            })
        });

        if (!response.ok) {
            throw new Error("API request failed.");
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        loadingMessage.textContent = "";

        const animeList = result.data.Page.media;

        if (animeList.length === 0 && currentPage === 1) {
            errorMessage.textContent =
                "No anime found. Please try another name.";
            return;
        }

        animeList.forEach(anime => {
            animeResults.appendChild(createAnimeCard(anime));
        });

        loadMoreButton.hidden = !result.data.Page.pageInfo.hasNextPage;

    } catch (error) {

        loadingMessage.textContent = "";
        errorMessage.textContent = "Something went wrong. Please try again.";
        console.error("AniList Error:", error);
    }
}

// Searching again from this page just reloads it with the new name
function searchAnime() {

    const animeName = animeInput.value.trim();

    if (animeName === "") {
        errorMessage.textContent = "Please enter an anime name.";
        return;
    }

    window.location.href = "search.html?q=" + encodeURIComponent(animeName);
}

searchButton.addEventListener("click", searchAnime);

animeInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        searchAnime();
    }

});

loadMoreButton.addEventListener("click", function () {
    currentPage++;
    loadResults();
});

if (searchTerm === "") {

    resultsTitle.textContent = "Search for an anime";
    errorMessage.textContent = "Please enter an anime name.";

} else {

    resultsTitle.textContent = 'Results for "' + searchTerm + '":';
    document.title = 'Results for "' + searchTerm + '" | Anime Finder';

    loadResults();
}
