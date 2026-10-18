const animeInput = document.getElementById("animeInput");
const searchButton = document.getElementById("searchButton");
const errorMessage = document.getElementById("errorMessage");

// Sends the person to the results page for whatever they typed
function searchAnime() {

    const animeName = animeInput.value.trim();

    errorMessage.textContent = "";

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
