const animeDetails = document.getElementById("animeDetails");
const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");
const backLink = document.getElementById("backLink");

const API_URL = "https://graphql.anilist.co";

const animeId = parseInt(
    new URLSearchParams(window.location.search).get("id"),
    10
);

const query = `
    query ($id: Int) {
        Media(id: $id, type: ANIME) {
            id
            isAdult

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

            type
            format
            status
            episodes
            duration
            season
            seasonYear
            source
            averageScore
            popularity
            favourites
            genres

            startDate { year month day }
            endDate { year month day }

            studios(isMain: true) {
                nodes {
                    name
                }
            }

            trailer {
                id
                site
            }

        }
    }
`;

/* ---------- helpers ---------- */

function titleCase(text) {
    return String(text)
        .toLowerCase()
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatDate(date) {

    if (!date || !date.year) {
        return "N/A";
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const parts = [];

    if (date.month) {
        parts.push(months[date.month - 1]);
    }

    if (date.day) {
        parts.push(date.day + ",");
    }

    parts.push(date.year);

    return parts.join(" ");
}

// AniList descriptions contain HTML: keep line breaks, drop everything else
function cleanDescription(text) {

    if (!text) {
        return "No description available.";
    }

    return text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
}

/* ---------- render ---------- */

function renderAnime(media) {

    const title =
        media.title.english ||
        media.title.romaji ||
        media.title.native ||
        "Unknown Title";

    document.title = title + " | Anime Finder";

    const cover = media.coverImage.extraLarge || media.coverImage.large || "";

    const alternateTitles = [media.title.romaji, media.title.native]
        .filter(name => name && name !== title)
        .map(escapeHtml)
        .join(" &bull; ");

    const season =
        media.season && media.seasonYear
            ? titleCase(media.season) + " " + media.seasonYear
            : media.seasonYear || "N/A";

    const studios =
        media.studios.nodes.length > 0
            ? media.studios.nodes.map(studio => escapeHtml(studio.name)).join(", ")
            : "N/A";

    const genres =
        media.genres.length > 0
            ? media.genres.map(genre =>
                `<a class="genre-chip" href="genres.html?genre=${encodeURIComponent(genre)}">${escapeHtml(genre)}</a>`
              ).join("")
            : "<span class=\"detail-muted\">N/A</span>";

    const rows = [
        ["Format", media.format ? media.format.replace(/_/g, " ") : "N/A"],
        ["Status", media.status ? titleCase(media.status) : "N/A"],
        ["Episodes", media.episodes || "N/A"],
        ["Duration", media.duration ? media.duration + " min per episode" : "N/A"],
        ["Season", season],
        ["Aired", formatDate(media.startDate) + " to " +
            (media.endDate && media.endDate.year ? formatDate(media.endDate) : "?")],
        ["Studio", studios],
        ["Source", media.source ? titleCase(media.source) : "N/A"]
    ];

    const rowsHtml = rows.map(row => `
        <div class="detail-row">
            <dt>${row[0]}</dt>
            <dd>${row[1]}</dd>
        </div>
    `).join("");

    const score = media.averageScore ? media.averageScore + "/100" : "N/A";

    const popularity = media.popularity
        ? media.popularity.toLocaleString()
        : "N/A";

    const favourites = media.favourites
        ? media.favourites.toLocaleString()
        : "N/A";

    let trailerHtml = "";

    if (media.trailer && media.trailer.site === "youtube" && media.trailer.id) {
        const trailerId = encodeURIComponent(media.trailer.id);

        trailerHtml = `
            <h3 class="detail-heading">Trailer</h3>

            <a class="trailer-link"
               href="https://www.youtube.com/watch?v=${trailerId}"
               target="_blank" rel="noopener noreferrer">
                <img src="https://img.youtube.com/vi/${trailerId}/hqdefault.jpg"
                     alt="Watch the trailer for ${escapeHtml(title)}">
                <span class="play-badge">▶ Watch on YouTube</span>
            </a>
        `;
    }

    const banner = media.bannerImage
        ? `<div class="detail-banner" style="background-image: url('${encodeURI(media.bannerImage)}')"></div>`
        : "";

    animeDetails.innerHTML = `
        <article class="detail-card">

            ${banner}

            <div class="detail-layout">

                <div class="detail-cover">
                    <img src="${cover}" alt="${escapeHtml(title)}">
                </div>

                <div class="detail-info">

                    <h2>${escapeHtml(title)}</h2>

                    ${alternateTitles ? `<p class="detail-alt-title">${alternateTitles}</p>` : ""}

                    <div class="detail-stats">
                        <div class="stat">
                            <span class="stat-value">${score}</span>
                            <span class="stat-label">Rating</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${popularity}</span>
                            <span class="stat-label">Popularity</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${favourites}</span>
                            <span class="stat-label">Favorites</span>
                        </div>
                    </div>

                    <div class="detail-genres">${genres}</div>

                </div>

            </div>

            <div class="detail-body">

                <h3 class="detail-heading">Synopsis</h3>
                <div class="detail-synopsis" id="detailSynopsis"></div>

                <h3 class="detail-heading">Information</h3>
                <dl class="detail-list">${rowsHtml}</dl>

                ${trailerHtml}

            </div>

        </article>
    `;

    // One <p> per paragraph (blank lines collapsed); textContent keeps
    // the synopsis safe from any markup in the API text
    const synopsisBox = document.getElementById("detailSynopsis");

    cleanDescription(media.description)
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph !== "")
        .forEach(paragraph => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            synopsisBox.appendChild(p);
        });

    // Same heart button as the cards, placed on the cover image
    const favoriteData = {
        id: media.id,
        title: media.title,
        coverImage: { large: media.coverImage.large },
        description: media.description,
        episodes: media.episodes,
        averageScore: media.averageScore,
        type: media.type,
        format: media.format,
        status: media.status,
        genres: media.genres
    };

    animeDetails
        .querySelector(".detail-cover")
        .appendChild(createHeartButton(favoriteData));
}

/* ---------- load ---------- */

async function loadAnime() {

    loadingMessage.textContent = "Loading anime details...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                query: query,
                variables: { id: animeId }
            })
        });

        const result = await response.json();

        loadingMessage.textContent = "";

        // AniList answers 404 when the id does not exist
        if (result.errors || !result.data || !result.data.Media) {
            errorMessage.textContent = "Anime not found.";
            return;
        }

        if (result.data.Media.isAdult) {
            errorMessage.textContent = "This anime is not available.";
            return;
        }

        renderAnime(result.data.Media);

    } catch (error) {

        loadingMessage.textContent = "";
        errorMessage.textContent = "Something went wrong. Please try again.";
        console.error("AniList Error:", error);
    }
}

// Back returns to the page the person opened this anime from
// (search results, genre list, favorites or home)
let previousPage = null;

try {
    previousPage = sessionStorage.getItem(BACK_URL_KEY);
} catch (error) {
    previousPage = null;
}

if (previousPage) {
    backLink.href = previousPage;
}

backLink.addEventListener("click", function (event) {

    // history.back() restores the earlier page just as it was
    if (previousPage && window.history.length > 1) {
        event.preventDefault();
        window.history.back();
    }
});

if (!animeId) {
    errorMessage.textContent = "No anime selected.";
} else {
    loadAnime();
}
