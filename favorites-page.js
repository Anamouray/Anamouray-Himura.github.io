const animeResults = document.getElementById("animeResults");
const emptyMessage = document.getElementById("emptyMessage");
const favoritesSubtitle = document.getElementById("favoritesSubtitle");

function updateState() {

    const count = getFavorites().length; 

    emptyMessage.hidden = count > 0;

    favoritesSubtitle.textContent =
        count === 0
            ? "Anime you have saved with the heart button."
            : count + (count === 1 ? " saved anime" : " saved anime titles");
}

function showFavorites() {

    getFavorites().forEach(anime => {

        const card = createAnimeCard(anime, function (nowFavorite, animeCard) {

            // Un-hearting on this page removes the card from the list
            if (!nowFavorite) {
                animeCard.remove();
                updateState();
            }
        });

        animeResults.appendChild(card);
    });

    updateState();
}

showFavorites();
