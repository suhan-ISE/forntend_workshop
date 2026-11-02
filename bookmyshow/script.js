/* --- Data Sources --- */
const moviesData = [
    { id: 1, title: "Dune: Part Two", genre: "Sci-Fi", lang: "English", cert: "U/A", rating: 9.2, duration: "2h 46m", isNowShowing: true, image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400" },
    { id: 2, title: "Fighter", genre: "Action", lang: "Hindi", cert: "U/A", rating: 8.5, duration: "2h 40m", isNowShowing: true, image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=400" },
    { id: 3, title: "Kalki 2898 AD", genre: "Sci-Fi", lang: "Telugu", cert: "U/A", rating: 8.9, duration: "3h 1m", isNowShowing: true, image: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?auto=format&fit=crop&q=80&w=400" },
    { id: 4, title: "Kung Fu Panda 4", genre: "Comedy", lang: "English", cert: "U", rating: 7.8, duration: "1h 34m", isNowShowing: true, image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400" },
    { id: 5, title: "Pushpa 2: The Rule", genre: "Action", lang: "Telugu", cert: "A", rating: "-", duration: "TBA", isNowShowing: false, image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400" },
    { id: 6, title: "Deadpool & Wolverine", genre: "Action", lang: "English", cert: "A", rating: "-", duration: "2h 7m", isNowShowing: false, image: "https://images.unsplash.com/photo-1561149877-84d257327394?auto=format&fit=crop&q=80&w=400" },
    { id: 7, title: "Singham Again", genre: "Action", lang: "Hindi", cert: "U/A", rating: "-", duration: "TBA", isNowShowing: false, image: "https://images.unsplash.com/photo-1579566346927-c68383817a25?auto=format&fit=crop&q=80&w=400" },
    { id: 8, title: "Inside Out 2", genre: "Comedy", lang: "English", cert: "U", rating: 8.8, duration: "1h 40m", isNowShowing: true, image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&q=80&w=400" }
];

const eventsData = [
    { id: 101, title: "Sunburn Arena Ft. Alan Walker", date: "Sat, 24 Oct", location: "Bhartiya City, Bengaluru", image: "https://images.unsplash.com/photo-1470229722913-7c090bbad56f?auto=format&fit=crop&q=80&w=400" },
    { id: 102, title: "Zakir Khan - Live Comedy", date: "Sun, 15 Nov", location: "Chowdiah Memorial Hall", image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=400" },
    { id: 103, title: "Arijit Singh - Live In Concert", date: "Sat, 05 Dec", location: "NICE Grounds, Bengaluru", image: "https://images.unsplash.com/photo-1501281668745-f7f57922c3b1?auto=format&fit=crop&q=80&w=400" },
    { id: 104, title: "Macbeth - Theatre Play", date: "Fri, 12 Nov", location: "Ranga Shankara", image: "https://images.unsplash.com/photo-1507676184212-d0330a15233c?auto=format&fit=crop&q=80&w=400" }
];

const sampleCinemas = [
    { id: 'c1', name: "PVR: Orion Mall, Rajajinagar", showtimes: ["10:00 AM", "01:30 PM", "06:15 PM", "10:30 PM"] },
    { id: 'c2', name: "INOX: Nexus Mall, Koramangala", showtimes: ["11:15 AM", "04:00 PM", "08:45 PM"] },
    { id: 'c3', name: "Cinepolis: Shantiniketan", showtimes: ["09:30 AM", "12:45 PM", "05:20 PM", "09:10 PM"] }
];

/* --- Global State --- */
let activeTab = 'now-showing';
let favourites = new Set();
let selectedMovie = null;
let bookingState = { date: null, cinema: null, time: null, seats: [], total: 0 };

/* --- DOM Elements --- */
const moviesGrid = document.getElementById('moviesGrid');
const eventsGrid = document.getElementById('eventsGrid');
const searchInput = document.getElementById('searchInput');
const langFilter = document.getElementById('languageFilter');
const genreFilter = document.getElementById('genreFilter');
const tabs = document.querySelectorAll('.category-tabs .tab');
const emptyState = document.getElementById('empty-state');

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    renderMovies();
    renderEvents();
    generateDates();
});

/* --- Movie Rendering & Filtering --- */
function renderMovies() {
    const searchTerm = searchInput.value.toLowerCase();
    const lang = langFilter.value;
    const genre = genreFilter.value;

    let filtered = moviesData.filter(movie => {
        // Tab filter
        if (activeTab === 'now-showing' && !movie.isNowShowing) return false;
        if (activeTab === 'coming-soon' && movie.isNowShowing) return false;
        if (activeTab === 'favourites' && !favourites.has(movie.id)) return false;

        // Search filter
        if (searchTerm && !movie.title.toLowerCase().includes(searchTerm) && !movie.genre.toLowerCase().includes(searchTerm)) return false;
        
        // Dropdown filters
        if (lang !== 'all' && movie.lang !== lang) return false;
        if (genre !== 'all' && movie.genre !== genre) return false;

        return true;
    });

    if (filtered.length === 0) {
        moviesGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        moviesGrid.innerHTML = filtered.map(movie => `
            <div class="movie-card" onclick="handleMovieClick(${movie.id}, event)">
                <div class="poster-wrapper">
                    <img src="${movie.image}" alt="${movie.title}">
                    <div class="shine"></div>
                    ${movie.rating !== '-' ? `<div class="rating-badge"><i class="fas fa-star"></i> ${movie.rating}/10</div>` : ''}
                    <button class="fav-btn ${favourites.has(movie.id) ? 'active' : ''}" onclick="toggleFavourite(${movie.id}, event)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-genre">${movie.genre}</p>
                    <div class="movie-tags">
                        <span class="tag">${movie.cert}</span>
                        <span class="tag">${movie.lang}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function renderEvents() {
    eventsGrid.innerHTML = eventsData.map(event => `
        <div class="event-card">
            <img src="${event.image}" alt="${event.title}">
            <div class="event-info">
                <p class="event-date">${event.date}</p>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            </div>
        </div>
    `).join('');
}

/* --- Event Listeners for Filters --- */
searchInput.addEventListener('input', renderMovies);
langFilter.addEventListener('change', renderMovies);
genreFilter.addEventListener('change', renderMovies);

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeTab = e.target.dataset.tab;
        renderMovies();
    });
});

/* --- Interactions --- */
function toggleFavourite(id, event) {
    event.stopPropagation(); // Prevent triggering movie card click
    if (favourites.has(id)) {
        favourites.delete(id);
    } else {
        favourites.add(id);
    }
    // Create sparkle effect optionally, then re-render
    renderMovies();
}

function handleMovieClick(id, event) {
    selectedMovie = moviesData.find(m => m.id === id);
    if(selectedMovie.isNowShowing) {
        openBookingModal();
    } else {
        alert("This movie is coming soon! Tickets are not yet available.");
    }
}

/* --- Modals Management --- */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.getElementById('confetti-container').style.display = 'none';
    document.getElementById('confetti-container').innerHTML = '';
}

/* --- Flow 1: Showtimes Selection --- */
function openBookingModal() {
    const header = document.getElementById('modalMovieHeader');
    header.innerHTML = `
        <img src="${selectedMovie.image}" alt="poster" class="modal-poster">
        <div class="modal-info">
            <h2>${selectedMovie.title}</h2>
            <p><i class="fas fa-video"></i> 2D, 3D, IMAX</p>
            <p><i class="fas fa-language"></i> ${selectedMovie.lang}</p>
            <p><i class="fas fa-clock"></i> ${selectedMovie.duration} • ${selectedMovie.genre} • ${selectedMovie.cert}</p>
        </div>
    `;
    
    // Render Cinemas
    const cList = document.getElementById('cinemaList');
    cList.innerHTML = sampleCinemas.map(c => `
        <div class="cinema-item">
            <div class="cinema-name"><i class="fas fa-heart" style="color:var(--primary-red)"></i> ${c.name}</div>
            <div class="showtimes">
                ${c.showtimes.map(t => `<button class="time-btn" onclick="selectShowtime('${c.name}', '${t}')">${t}</button>`).join('')}
            </div>
        </div>
    `).join('');

    openModal('bookingModal');
}

function generateDates() {
    const dateSelector = document.getElementById('dateSelector');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    let html = '';
    const today = new Date();
    
    for(let i=0; i<7; i++) {
        let d = new Date(today);
        d.setDate(today.getDate() + i);
        let active = i === 0 ? 'active' : '';
        if(i===0) bookingState.date = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`; // Default selection
        html += `
            <div class="date-btn ${active}" onclick="selectDate(this, '${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}')">
                <div class="day">${days[d.getDay()]}</div>
                <div class="date">${d.getDate()}</div>
            </div>
        `;
    }
    dateSelector.innerHTML = html;
}

function selectDate(el, dateStr) {
    document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    bookingState.date = dateStr;
}

function selectShowtime(cinemaName, time) {
    bookingState.cinema = cinemaName;
    bookingState.time = time;
    closeModal('bookingModal');
    openSeatSelection();
}

/* --- Flow 2: Seat Selection --- */
function openSeatSelection() {
    bookingState.seats = []; // reset seats
    bookingState.total = 0;
    
    document.getElementById('seatMovieTitle').innerText = selectedMovie.title;
    document.getElementById('seatCinemaInfo').innerText = `${bookingState.cinema} | ${bookingState.date}, ${bookingState.time}`;
    
    renderSeatLayout();
    updateSeatFooter();
    openModal('seatModal');
}

function renderSeatLayout() {
    const layout = document.getElementById('seatLayout');
    const rows = [
        { label: 'F', category: 'Premium', price: 400, count: 12 },
        { label: 'E', category: 'Gold', price: 250, count: 14 },
        { label: 'D', category: 'Gold', price: 250, count: 14 },
        { label: 'C', category: 'Gold', price: 250, count: 16 },
        { label: 'B', category: 'Silver', price: 150, count: 16 },
        { label: 'A', category: 'Silver', price: 150, count: 16 }
    ];

    let html = '';
    rows.forEach(r => {
        html += `<div class="seat-row"><div class="row-label">${r.label}</div>`;
        for(let i=1; i<=r.count; i++) {
            // Randomly book some seats for demo
            let isBooked = Math.random() < 0.2; 
            let statusClass = isBooked ? 'booked' : 'available';
            let seatId = `${r.label}${i}`;
            html += `<div class="seat ${statusClass}" data-id="${seatId}" data-price="${r.price}" onclick="toggleSeat(this)"></div>`;
            
            // Add aisle gap
            if(i === Math.floor(r.count/2)) {
                html += `<div style="width:20px"></div>`;
            }
        }
        html += `</div>`;
    });
    layout.innerHTML = html;
}

function toggleSeat(seatEl) {
    if(seatEl.classList.contains('booked')) return;
    
    const seatId = seatEl.getAttribute('data-id');
    const price = parseInt(seatEl.getAttribute('data-price'));

    if(seatEl.classList.contains('selected')) {
        seatEl.classList.remove('selected');
        bookingState.seats = bookingState.seats.filter(id => id !== seatId);
        bookingState.total -= price;
    } else {
        // Limit max seats
        if(bookingState.seats.length >= 10) {
            alert("You can select a maximum of 10 seats.");
            return;
        }
        seatEl.classList.add('selected');
        bookingState.seats.push(seatId);
        bookingState.total += price;
    }
    updateSeatFooter();
}

function updateSeatFooter() {
    const count = bookingState.seats.length;
    document.getElementById('selectedSeatCount').innerText = count === 1 ? '1 Seat' : `${count} Seats`;
    document.getElementById('totalPrice').innerText = `₹${bookingState.total}`;
    
    const btn = document.getElementById('btnContinueCheckout');
    btn.disabled = count === 0;
    btn.onclick = openCheckout;
}

/* --- Flow 3: Checkout Summary --- */
function openCheckout() {
    closeModal('seatModal');
    const fee = bookingState.seats.length * 30; // 30rs convenience fee per ticket
    const finalTotal = bookingState.total + fee;

    const summary = document.getElementById('summaryDetails');
    summary.innerHTML = `
        <div class="summary-row"><span>Movie</span> <strong>${selectedMovie.title}</strong></div>
        <div class="summary-row"><span>Cinema</span> <span>${bookingState.cinema}</span></div>
        <div class="summary-row"><span>Date & Time</span> <span>${bookingState.date} | ${bookingState.time}</span></div>
        <div class="summary-row"><span>Seats</span> <span>${bookingState.seats.join(', ')}</span></div>
        <div class="summary-row" style="margin-top:20px;"><span>Ticket Amount</span> <span>₹${bookingState.total}</span></div>
        <div class="summary-row"><span>Convenience Fee</span> <span>₹${fee}</span></div>
        <div class="summary-row bold"><span>Total Payable Amount</span> <span>₹${finalTotal}</span></div>
    `;
    openModal('checkoutModal');
}

/* --- Flow 4: Success & Confetti --- */
function confirmBooking() {
    closeModal('checkoutModal');
    
    // Generate Random Ticket ID
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('ticketIdDisplay').innerText = `ID: TICK-${randomId}`;
    
    openModal('successModal');
    triggerConfetti();
}

function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.style.display = 'block';
    container.innerHTML = '';
    const colors = ['#F84464', '#2DC492', '#FFD700', '#5E35B1', '#FFFFFF'];
    
    for(let i=0; i<80; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        // Random shapes
        if(Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }
        
        container.appendChild(confetti);
    }
}