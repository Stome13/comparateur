/* main.js handles search, dynamic result rendering, best-price badge, favorites */

// Perform a search and redirect to results page with query
function performSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        window.location.href = `results.html?q=${encodeURIComponent(query)}`;
    }
}

// Read query string
function getQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
}

// Render offer list on results page (each offer separately)
function renderResults(list) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    // flatten offers and mark best among all
    let offers = [];
    list.forEach(prod => {
        prod.offers.forEach(o => {
            offers.push({
                productId: prod.id,
                name: prod.name,
                image: prod.image,
                site: o.site,
                price: o.price,
                link: o.link
            });
        });
    });
    if (offers.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Aucun produit trouvé</div>';
        return;
    }
    const minPrice = Math.min(...offers.map(o => o.price));
    let html = '<div class="row g-4">';
    offers.forEach(o => {
        const isBest = o.price === minPrice;
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm position-relative">
                    ${isBest ? '<span class="badge bg-success position-absolute top-0 end-0 m-3">Meilleur prix</span>' : ''}
                    <img src="${o.image}" alt="${o.name}" class="card-img-top" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${o.name}</h5>
                        <p class="card-text text-muted"><strong>Site :</strong> ${o.site}</p>
                        <p class="card-text text-primary fw-bold fs-5">${o.price.toFixed(2)} €</p>
                        <div class="d-grid gap-2">
                            <a href="${o.link}" target="_blank" class="btn btn-warning btn-sm">Voir l'offre</a>
                            <a href="product.html?id=${o.productId}" class="btn btn-primary btn-sm">Détails</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Filtering and sorting utilities
function applyFilters() {
    const min = parseFloat(document.getElementById('min-price').value) || 0;
    const max = parseFloat(document.getElementById('max-price').value) || Infinity;
    const sort = document.getElementById('sort-by').value;
    // work on products but filter offers inside
    let filteredProducts = window.currentResults.map(p => {
        const copies = Object.assign({}, p);
        copies.offers = copies.offers.filter(o => o.price >= min && o.price <= max);
        return copies;
    }).filter(p => p.offers.length > 0);
    if (sort === 'price-asc' || sort === 'price-desc') {
        // flatten to offers for sorting
        let offers = [];
        filteredProducts.forEach(p=>{
            p.offers.forEach(o=>{
                offers.push({prod:p, offer:o});
            });
        });
        offers.sort((a,b)=> a.offer.price - b.offer.price);
        if(sort==='price-desc') offers.reverse();
        // rebuild product list preserving order by first appearance
        const ordered = [];
        offers.forEach(({prod})=>{
            if(!ordered.includes(prod)) ordered.push(prod);
        });
        filteredProducts = ordered;
    } else if (sort === 'popularity') {
        filteredProducts.sort((a,b)=> b.popularity - a.popularity);
    }
    renderResults(filteredProducts);
    window.currentResults = filteredProducts;
}

// On results page load
function initResultsPage() {
    const q = getQuery().toLowerCase();
    // simple search by name
    const matched = products.filter(p => p.name.toLowerCase().includes(q));
    window.currentResults = matched;
    renderResults(matched);
    // add listeners
    document.getElementById('filter-form').addEventListener('submit', function(e){ e.preventDefault(); applyFilters(); });
}

// Favorite logic
function toggleFavorite(id) {
    let favs = JSON.parse(localStorage.getItem('favorites')||'[]');
    if (favs.includes(id)) {
        favs = favs.filter(f=>f!==id);
    } else {
        favs.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function isFavorite(id) {
    const favs = JSON.parse(localStorage.getItem('favorites')||'[]');
    return favs.includes(id);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', performSearch);
    }
    
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        initResultsPage();
    }
});


window.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    if (searchForm) searchForm.addEventListener('submit', performSearch);
    if (document.body.id === 'results-page') initResultsPage();
});
