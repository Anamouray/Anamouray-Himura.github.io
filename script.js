 
const animeInput = document.getElementById("animeInput");
const searchButton = document.getElementById("searchButton");
const animeResults = document.getElementById("animeResults");
const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");


const API_URL = "https://graphql.anilist.co";


async function searchAnime() {


    const animeName = animeInput.value.trim();

    animeResults.innerHTML = "";
    errorMessage.textContent = "";
    loadingMessage.textContent = "";

    
    if (animeName === "") {
        errorMessage.textContent = "Please enter an anime name.";
        return;
    }

    loadingMessage.textContent = "Searching for anime...";

    const query = `
        query ($search: String) {
            Page(page: 1, perPage: 12) {
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

    const variables = {
        search: animeName
    };

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        if (!response.ok) {
            throw new Error("API request failed.");
        }

        const result = await response.json();

        console.log("AniList response:", result);

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        loadingMessage.textContent = "";

        const animeList = result.data.Page.media;

        if (animeList.length === 0) {
            errorMessage.textContent =
                "No anime found. Please try another name.";
            return;
        }


        animeList.forEach(anime => {
            animeResults.appendChild(createAnimeCard(anime));
        });

        animeResults.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {

        loadingMessage.textContent = "";

        errorMessage.textContent =
            "Something went wrong. Please try again.";

        console.error("AniList Error:", error);
    }
}

searchButton.addEventListener("click", searchAnime);

animeInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchAnime();
    }

});
