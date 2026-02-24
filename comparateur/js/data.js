// Simulated product dataset
const products = [
    {
        id: 1,
        name: "Smartphone X200",
        description: "Un smartphone haut de gamme avec écran OLED et double caméra.",
        image: "https://via.placeholder.com/150?text=Smartphone",
        offers: [
            { site: "Amazon", price: 499.99, availability: "En stock", link: "#" },
            { site: "Jumia", price: 479.50, availability: "En stock", link: "#" },
            { site: "eBay", price: 515.00, availability: "Limitée", link: "#" }
        ],
        popularity: 85,
        priceHistory: [
            { date: "2026-01-01", price: 520 },
            { date: "2026-02-01", price: 510 },
            { date: "2026-03-01", price: 499.99 }
        ]
    },
    {
        id: 2,
        name: "Casque Audio Pro",
        description: "Casque sans fil avec réduction active du bruit.",
        image: "https://via.placeholder.com/150?text=Casque",
        offers: [
            { site: "Amazon", price: 199.99, availability: "En stock", link: "#" },
            { site: "Jumia", price: 189.99, availability: "En stock", link: "#" },
            { site: "eBay", price: 210.00, availability: "En stock", link: "#" }
        ],
        popularity: 60,
        priceHistory: [
            { date: "2026-01-01", price: 210 },
            { date: "2026-02-01", price: 205 },
            { date: "2026-03-01", price: 199.99 }
        ]
    },
    {
        id: 3,
        name: "Laptop Gamer Z15",
        description: "PC portable gamer avec carte graphique RTX et écran 144Hz.",
        image: "https://via.placeholder.com/150?text=Laptop",
        offers: [
            { site: "Amazon", price: 1299.99, availability: "En stock", link: "#" },
            { site: "Jumia", price: 1250.00, availability: "Rupture", link: "#" },
            { site: "eBay", price: 1320.00, availability: "En stock", link: "#" }
        ],
        popularity: 95,
        priceHistory: [
            { date: "2026-01-01", price: 1350 },
            { date: "2026-02-01", price: 1300 },
            { date: "2026-03-01", price: 1299.99 }
        ]
    }
];

// Utility to find by ID
function getProductById(id) {
    return products.find(p => p.id === parseInt(id, 10));
}
