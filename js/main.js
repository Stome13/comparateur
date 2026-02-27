/* script principal de recherche en direct utilisant l'API gratuite DummyJSON (aucune clé requise)
   Tout est implémenté en JavaScript pur et s'exécute entièrement dans le
   navigateur. */

// -------- configuration -------------------------------------------------
// catégories statiques facultatives pour les badges de la page d'accueil (non utilisées par l'API)
const categories = [
    "Smartphones","Casques","Laptops","Tablettes","Montres",
    "Accessoires","TV","Appareils photo","Imprimantes","Jeux vidéo",
    "TVOLED","Enceintes","Drones","Écouteurs","Souris","Claviers",
    "Moniteurs","Routeurs","Disques durs","Logiciels"
];

// -------- utilitaires ----------------------------------------------------
function getQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
}

function parsePrice(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// récupération depuis dummyjson.com qui propose une recherche de produits simple
function fetchSerpResults(q) {
    const url = `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`;
    return fetch(url)
        .then(res => res.json())
        .then(data => (data.products || []).map(item => ({
            title: item.title,
            link: item.url || '#',          // DummyJSON ne fournit pas de lien réel vers le produit
            image: item.thumbnail || '',
            price: typeof item.price === 'number' ? item.price : parsePrice(item.price),
            site: item.brand || item.category || '',
            currency: '€'                   // données factices, on suppose l'euro pour l'affichage
        })));
}

// utilitaires de stockage
function loadFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}
function saveFavorites(list) {
    localStorage.setItem('favorites', JSON.stringify(list));
}
function isFavorite(item) {
    return loadFavorites().some(f => {
        // compare by link when available, otherwise use title
        if (item.link && item.link !== '#') return f.link === item.link;
        return f.title === item.title;
    });
}
function toggleFavorite(item) {
    let favs = loadFavorites();
    if (isFavorite(item)) {
        favs = favs.filter(f => {
            if (item.link && item.link !== '#') return f.link !== item.link;
            return f.title !== item.title;
        });
    } else {
        favs.push(item);
    }
    saveFavorites(favs);
}

function addToHistory(item) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.unshift({ when: Date.now(), item });
    if (history.length > 100) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
}
function loadHistory() {
    return JSON.parse(localStorage.getItem('history') || '[]');
}

// -------- rendu -------------------------------------------------------
function renderResults(items) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Aucun produit trouvé</div>';
        return;
    }
    const minPrice = Math.min(...items.map(i => i.price));
    let html = '<div class="row g-4">';
    items.forEach((i, idx) => {
        const best = i.price === minPrice;
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm position-relative">
                    ${best ? '<span class="badge bg-success position-absolute top-0 end-0 m-3">Meilleur prix</span>' : ''}
                    <img src="${i.image}" alt="${i.title}" class="card-img-top" style="height:200px;object-fit:cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${i.title}</h5>
                        <p class="card-text text-muted"><strong>Site:</strong> ${i.site}</p>
                        <p class="card-text text-primary fw-bold fs-5">${i.price.toFixed(2)} ${i.currency}</p>
                        <div class="mt-auto d-grid gap-2">
                            <a href="${i.link}" target="_blank" class="btn btn-warning btn-sm">Voir l'offre</a>
                            <button onclick="viewDetails(${idx})" class="btn btn-primary btn-sm">Détails</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderFavoritesPage() {
    const favs = loadFavorites();
    const container = document.getElementById('favorites-list');
    if (!container) return;
    if (favs.length === 0) {
        container.innerHTML = `<div class="text-center py-5">
            <p class="fs-5 text-muted mb-4">Aucun produit en favoris</p>
            <a href="index.html" class="btn btn-primary btn-lg">Découvrir les produits</a>
        </div>`;
        return;
    }
    container.innerHTML = '<div class="row g-4">' + favs.map((p, idx) => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm">
                <img src="${p.image}" alt="${p.title}" class="card-img-top" style="height:200px;object-fit:cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${p.title}</h5>
                    <p class="text-primary fw-bold fs-5 mb-3">À partir de ${p.price.toFixed(2)} ${p.currency}</p>
                    <div class="mt-auto d-grid gap-2">
                        <button onclick="viewFavoriteDetails(${idx})" class="btn btn-primary">Voir détails</button>
                        <button onclick="removeFavorite(${idx}); renderFavoritesPage();" class="btn btn-danger">Supprimer</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') + '</div>';
}

// build an index of history entries by product to power the select + detail view
function renderHistoryPage() {
    const history = loadHistory();
    const container = document.getElementById('history-content');
    const select = document.getElementById('product-select');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<p>Aucune consultation enregistrée</p>';
        return;
    }

    // group by link/title key
    const groups = {};
    history.forEach(h => {
        const key = h.item.link || h.item.title;
        if (!groups[key]) groups[key] = { title: h.item.title, records: [] };
        groups[key].records.push({ when: h.when, price: h.item.price });
    });
    const products = Object.values(groups);

    // populate select element if present
    if (select) {
        products.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = p.title;
            select.appendChild(opt);
        });

        // initial prompt in container
        container.innerHTML = '<p>Sélectionnez un produit ci-dessus pour afficher l\'historique.</p>';

        select.addEventListener('change', () => {
            const idx = select.value;
            if (idx === '') {
                container.innerHTML = '<p>Sélectionnez un produit ci-dessus pour afficher l\'historique.</p>';
                return;
            }
            renderHistoryDetail(products[idx]);
        });
    } else {
        // if select missing, just show default message
        container.innerHTML = '<p>Sélectionnez un produit pour afficher l\'historique.</p>';
    }
}

// render detailed history for a single product, including chart
function renderHistoryDetail(product) {
    const container = document.getElementById('history-content');
    if (!container) return;

    const rows = product.records.slice().sort((a, b) => a.when - b.when);
    let html = `<h4>${product.title}</h4>`;
    html += '<canvas id="history-chart" class="mb-4"></canvas>';
    html += '<ul class="list-group">';
    rows.forEach(r => {
        html += `<li class="list-group-item">${new Date(r.when).toLocaleString()} - ${r.price.toFixed(2)} €</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;

    drawPriceHistory('history-chart', rows.map(r => ({ date: new Date(r.when).toLocaleDateString(), price: r.price })));
}


// -------- interactions -------------------------------------------------
function viewDetails(idx) {
    const item = window.currentResults[idx];
    if (!item) return;
    sessionStorage.setItem('selectedProduct', JSON.stringify(item));
    addToHistory(item);
    window.location.href = 'product.html';
}
function viewFavoriteDetails(idx) {
    const favs = loadFavorites();
    const item = favs[idx];
    if (!item) return;
    sessionStorage.setItem('selectedProduct', JSON.stringify(item));
    window.location.href = 'product.html';
}
function removeFavorite(idx) {
    let favs = loadFavorites();
    favs.splice(idx,1);
    saveFavorites(favs);
}

// retrieve price history entries for a given product (by link or title key)
function getHistoryForProduct(item) {
    const entries = loadHistory().filter(h => {
        return (item.link && h.item.link === item.link) || h.item.title === item.title;
    });
    return entries
        .map(h => ({ date: new Date(h.when).toLocaleDateString(), price: h.item.price }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}


function applyFilters() {
    const min = parseFloat(document.getElementById('min-price').value) || 0;
    const max = parseFloat(document.getElementById('max-price').value) || Infinity;
    const sort = document.getElementById('sort-by').value;
    let filtered = window.currentResults.filter(i=>i.price>=min && i.price<=max);
    if(sort==='price-asc') filtered.sort((a,b)=>a.price-b.price);
    else if(sort==='price-desc') filtered.sort((a,b)=>b.price-a.price);
    renderResults(filtered);
    window.currentResults = filtered;
}

// -------- initialisation des pages ------------------------------------
async function initResultsPage() {
    const q = getQuery().trim();
    if(!q) return;
    try {
        const items = await fetchSerpResults(q);
        window.currentResults = items;
        renderResults(items);
        document.getElementById('filter-form').addEventListener('submit', e=>{e.preventDefault();applyFilters();});
    } catch(err) {
        console.error(err);
        document.getElementById('results-container').innerHTML = '<div class="alert alert-danger">Erreur lors de la recherche</div>';
    }
}

function performSearch(e) {
    // redirect to results page with query parameter
    const input = document.getElementById('search-input');
    if (!input) return;
    const q = input.value.trim();
    if (q) {
        window.location.href = `results.html?q=${encodeURIComponent(q)}`;
    }
}

function populateSuggestions() {
    const list = document.getElementById('search-suggestions');
    if (!list || !Array.isArray(categories)) return;
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        list.appendChild(opt);
    });
}

function initIndexPage() {
    const container = document.getElementById('products-container');
    if(container) container.innerHTML = '<p class="text-center text-muted">Entrez un produit dans la barre de recherche.</p>';
}

// -------- démarrage au chargement ------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    if(form) form.addEventListener('submit', e=>{e.preventDefault();performSearch(e);});
    if(document.getElementById('results-container')) initResultsPage();
    if(document.getElementById('favorites-list')) renderFavoritesPage();
    if(document.getElementById('history-content')) renderHistoryPage();
    if(document.getElementById('products-container')) initIndexPage();
    populateSuggestions();
});
