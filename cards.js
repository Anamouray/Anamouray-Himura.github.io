/* =========================================================
   SHARED: favorites storage + anime card builder
   Used by index.html, genre.html and favorites.html
   ========================================================= */

const FAVORITES_KEY = "animeFinderFavorites";

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveFavorites(list) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch (error) {
        console.error("Could not save favorites:", error);
    }
}

function isFavorite(id) {
    return getFavorites().some(item => item.id === id);
}

// Adds or removes an anime. Returns true if it is now a favorite.
function toggleFavorite(anime) {
    const favorites = getFavorites();
    const index = favorites.findIndex(item => item.id === anime.id);

    if (index >= 0) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        return false;
    }

    favorites.push(anime);
    saveFavorites(favorites);
    return true;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function createHeartButton(anime, onChange) {

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("favorite-button");

    button.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 4.5 6.4 4.5c2.1 0 3.8 1.2 5.6 3.3 1.8-2.1 3.5-3.3 5.6-3.3 3.8 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z"/>
        </svg>
    `;

    function render() {
        const active = isFavorite(anime.id);
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active);
        button.setAttribute(
            "aria-label",
            active ? "Remove from favorites" : "Add to favorites"
        );
        button.title = active ? "Remove from favorites" : "Add to favorites";
    }

    button.addEventListener("click", function () {
        const nowFavorite = toggleFavorite(anime);
        render();

        if (onChange) {
            onChange(nowFavorite);
        }
    });

    render();

    return button;
}

function createAnimeCard(anime, onFavoriteChange) {

    const animeCard = document.createElement("div");
    animeCard.classList.add("anime-card");

    const title =
        anime.title.english ||
        anime.title.romaji ||
        anime.title.native ||
        "Unknown Title";

    const image = anime.coverImage.large || "";

    let description = anime.description || "No description available.";
    description = description.replace(/<[^>]*>/g, "");

    if (description.length > 300) {
        description = description.substring(0, 300) + "...";
    }

    const score = anime.averageScore ? anime.averageScore + "/100" : "N/A";
    const episodes = anime.episodes || "N/A";
    const type = anime.format || anime.type || "N/A";

    const genres =
        anime.genres.length > 0
            ? anime.genres.map(genre =>
                `<a class="genre-link" href="genres.html?genre=${encodeURIComponent(genre)}">${genre}</a>`
              ).join(", ")
            : "N/A";

    animeCard.innerHTML = `
        <a class="card-image-link" href="anime.html?id=${anime.id}" title="View details for ${escapeHtml(title)}">
            <img src="${image}" alt="${escapeHtml(title)}">
        </a>

        <div class="anime-card-content">

            <h3>${escapeHtml(title)}</h3>

            <p><strong>Type:</strong> ${type}</p>

            <p><strong>Episodes:</strong> ${episodes}</p>

            <p><strong>Rating:</strong> ${score}</p>

            <p><strong>Genres:</strong> ${genres}</p>

            <p>${escapeHtml(description)}</p>

        </div>
    `;

    animeCard.appendChild(
        createHeartButton(anime, function (nowFavorite) {
            if (onFavoriteChange) {
                onFavoriteChange(nowFavorite, animeCard);
            }
        })
    );

    return animeCard;
}
