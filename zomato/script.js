// Sample Data
const locations = ["New Delhi", "Mumbai", "Bengaluru", "Pune"];
const foodCategories = [
    { name: "Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200" },
    { name: "Biryani", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200" },
    { name: "Burgers", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200" },
    { name: "South Indian", img: "https://images.unsplash.com/photo-1610192773928-769229e71b56?w=200" },
    { name: "Chinese", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200" },
    { name: "Desserts", img: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200" }
];

const restaurants = [
    {
        id: 1,
        name: "Biryani Blues",
        rating: 4.2,
        cuisine: "North Indian, Biryani",
        time: 25,
        price: "₹400 for two",
        isVeg: false,
        img: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=500",
        menu: [
            { id: 101, name: "Chicken Dum Biryani", price: 350, desc: "Aromatic basmati rice cooked with tender chicken." },
            { id: 102, name: "Paneer 65", price: 250, desc: "Spicy and crispy fried paneer cubes." }
        ]
    },
    {
        id: 2,
        name: "Green Leaf",
        rating: 4.5,
        cuisine: "South Indian, Thali",
        time: 30,
        price: "₹300 for two",
        isVeg: true,
        img: "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=500",
        menu: [
            { id: 201, name: "Masala Dosa", price: 120, desc: "Crispy crepe stuffed with spiced potato." },
            { id: 202, name: "Idli Sambar", price: 90, desc: "Soft steamed rice cakes with lentil soup." }
        ]
    },
    {
        id: 3,
        name: "Pizza Paradise",
        rating: 3.8,
        cuisine: "Italian, Pizza, Fast Food",
        time: 40,
        price: "₹600 for two",
        isVeg: false,
        img: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500",
        menu: [
            { id: 301, name: "Pepperoni Pizza", price: 450, desc: "Classic cheese and pepperoni." },
            { id: 302, name: "Veggie Supreme", price: 400, desc: "Loaded with mushrooms, bell peppers, and onions." }
        ]
    },
    {
        id: 4,
        name: "The Sugar Bowl",
        rating: 4.7,
        cuisine: "Desserts, Ice Cream",
        time: 20,
        price: "₹250 for two",
        isVeg: true,
        img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500",
        menu: [
            { id: 401, name: "Chocolate Truffle Cake", price: 150, desc: "Rich and gooey chocolate slice." },
            { id: 402, name: "Vanilla Sundae", price: 120, desc: "Classic vanilla with hot fudge." }
        ]
    }
];

// State variables
let cart = [];
let currentFilteredRestaurants = [...restaurants];
let activeFilters = { veg: false, rating: false, time: false, searchQuery: "" };

// DOM Elements
const locationSelect = document.getElementById("location-select");
const heroLocation = document.getElementById("heroLocation");
const sectionLocation = document.getElementById("section-location");
const foodTypesContainer = document.getElementById("food-types-container");
const restaurantGrid = document.getElementById("restaurant-grid");
const noResultsDiv = document.getElementById("no-results");
const cartCount = document.getElementById("cart-count");

// Search & Filters Elements
const navSearch = document.getElementById("nav-search");
const mainSearch = document.getElementById("main-search");
const btnVeg = document.getElementById("filter-veg");
const btnRating = document.getElementById("filter-rating");
const btnTime = document.getElementById("filter-time");
const btnClear = document.getElementById("clear-filters");

// Modals
const restaurantModal = document.getElementById("restaurant-modal");
const cartModal = document.getElementById("cart-modal");

// Initialization
function init() {
    renderFoodCategories();
    renderRestaurants();
    setupEventListeners();
}

// Render Data
function renderFoodCategories() {
    foodTypesContainer.innerHTML = foodCategories.map(cat => `
        <div class="food-item" onclick="filterByCuisine('${cat.name}')">
            <img src="${cat.img}" alt="${cat.name}">
            <h4>${cat.name}</h4>
        </div>
    `).join("");
}

function renderRestaurants() {
    restaurantGrid.innerHTML = "";
    if (currentFilteredRestaurants.length === 0) {
        noResultsDiv.classList.remove("hidden");
    } else {
        noResultsDiv.classList.add("hidden");
        currentFilteredRestaurants.forEach(res => {
            const card = document.createElement("div");
            card.className = "restaurant-card";
            card.onclick = () => openRestaurant(res.id);
            card.innerHTML = `
                <div class="restaurant-img-wrapper">
                    <img src="${res.img}" alt="${res.name}">
                    <span class="time-badge">${res.time} min</span>
                </div>
                <div class="restaurant-info">
                    <div class="res-header">
                        <div class="res-name">${res.name}</div>
                        <div class="res-rating">${res.rating} <i class="fas fa-star" style="font-size:10px;"></i></div>
                    </div>
                    <div class="res-sub">
                        <span>${res.cuisine}</span>
                        <span>${res.price}</span>
                    </div>
                </div>
            `;
            restaurantGrid.appendChild(card);
        });
    }
}

// Filtering Logic
function applyFilters() {
    currentFilteredRestaurants = restaurants.filter(res => {
        let matchesVeg = activeFilters.veg ? res.isVeg : true;
        let matchesRating = activeFilters.rating ? res.rating >= 4.0 : true;
        let matchesTime = activeFilters.time ? res.time <= 30 : true;
        let matchesSearch = true;

        if (activeFilters.searchQuery) {
            const q = activeFilters.searchQuery.toLowerCase();
            matchesSearch = res.name.toLowerCase().includes(q) || res.cuisine.toLowerCase().includes(q);
        }

        return matchesVeg && matchesRating && matchesTime && matchesSearch;
    });
    renderRestaurants();
}

function filterByCuisine(cuisine) {
    navSearch.value = cuisine;
    activeFilters.searchQuery = cuisine;
    applyFilters();
    document.querySelector('.restaurants-section').scrollIntoView({ behavior: 'smooth' });
}

// Event Listeners Setup
function setupEventListeners() {
    // Location Select
    locationSelect.addEventListener("change", (e) => {
        const val = e.target.options[e.target.selectedIndex].text;
        document.getElementById("hero-location").innerText = val;
        sectionLocation.innerText = val;
    });

    // Search Sync
    const handleSearch = (e) => {
        const val = e.target.value;
        navSearch.value = val;
        mainSearch.value = val;
        activeFilters.searchQuery = val;
        applyFilters();
    };
    navSearch.addEventListener("input", handleSearch);
    mainSearch.addEventListener("input", handleSearch);

    // Filters
    btnVeg.addEventListener("click", () => { 
        activeFilters.veg = !activeFilters.veg; 
        btnVeg.classList.toggle("active"); applyFilters(); 
    });
    btnRating.addEventListener("click", () => { 
        activeFilters.rating = !activeFilters.rating; 
        btnRating.classList.toggle("active"); applyFilters(); 
    });
    btnTime.addEventListener("click", () => { 
        activeFilters.time = !activeFilters.time; 
        btnTime.classList.toggle("active"); applyFilters(); 
    });
    btnClear.addEventListener("click", () => {
        activeFilters = { veg: false, rating: false, time: false, searchQuery: "" };
        navSearch.value = ""; mainSearch.value = "";
        btnVeg.classList.remove("active"); btnRating.classList.remove("active"); btnTime.classList.remove("active");
        applyFilters();
    });

    // Modals
    document.getElementById("close-restaurant-modal").addEventListener("click", () => restaurantModal.classList.remove("active"));
    document.getElementById("open-cart-btn").addEventListener("click", openCart);
    document.getElementById("close-cart-modal").addEventListener("click", () => cartModal.classList.remove("active"));
}

// Restaurant Modal & Menu
function openRestaurant(id) {
    const res = restaurants.find(r => r.id === id);
    document.getElementById("modal-restaurant-header").innerHTML = `
        <h2>${res.name}</h2>
        <p style="color:var(--text-light); margin-bottom:20px;">${res.cuisine} • ${res.rating}★</p>
    `;
    
    const menuContainer = document.getElementById("menu-container");
    menuContainer.innerHTML = res.menu.map(item => `
        <div class="menu-item">
            <div class="menu-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price}</p>
                <p style="font-size:12px; margin-top:5px;">${item.desc}</p>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${res.id}, ${item.id})">Add</button>
        </div>
    `).join("");

    restaurantModal.classList.add("active");
}

// Cart Logic
function addToCart(resId, itemId) {
    const res = restaurants.find(r => r.id === resId);
    const item = res.menu.find(m => m.id === itemId);
    
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1, resName: res.name });
    }
    updateCartUI();
    
    // Quick visual feedback
    cartCount.style.transform = "scale(1.2)";
    setTimeout(() => cartCount.style.transform = "scale(1)", 200);
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = totalItems;
}

function openCart() {
    const cartContainer = document.getElementById("cart-items-container");
    if (cart.length === 0) {
        cartContainer.innerHTML = "<p style='text-align:center; padding: 20px 0;'>Your cart is empty.</p>";
        document.getElementById("cart-total-price").innerText = "₹0";
    } else {
        cartContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <p style="font-size:12px; color:var(--text-light);">${item.resName}</p>
                    <p>₹${item.price}</p>
                </div>
                <div class="cart-controls">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
        `).join("");
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        document.getElementById("cart-total-price").innerText = `₹${total}`;
    }
    cartModal.classList.add("active");
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
    openCart(); // Re-render cart modal contents
}

// Run app
window.onload = init;