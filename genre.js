const animeResults = document.getElementById("animeResults");
const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");
const loadMoreButton = document.getElementById("loadMoreButton");
const genreTitle = document.getElementById("genreTitle");
const genreSubtitle = document.getElementById("genreSubtitle");

const API_URL = "https://graphql.anilist.co";
 
const genre = new URLSearchParams(window.location.search).get("genre");

let currentPage = 1;

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

    errorMessage.textContent = "";
    loadingMessage.textContent = "Loading anime...";
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
                variables: { genre: genre, page: currentPage }
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
            errorMessage.textContent = "No anime found in this genre.";
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

if (!genre) {

    genreTitle.textContent = "No genre selected";
    genreSubtitle.textContent = "Go back and click a genre on any anime.";

} else {

    genreTitle.textContent = genre;
    genreSubtitle.textContent = "Popular " + genre + " anime.";
    document.title = genre + " Anime | Anime Finder";

    loadGenre();

    loadMoreButton.addEventListener("click", function () {
        currentPage++;
        loadGenre();
    });
}
