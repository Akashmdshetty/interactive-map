// Initialize Map
const map = L.map('map').setView([20, 0], 2);

// Add Tile Layers
const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps contributors',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenTopo contributors'
});

const labelOverlay = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.6
});

const hybridLayer = L.layerGroup([
    satelliteLayer,
    labelOverlay
]);

// Layer Control
const layers = {
    "Street View": streetLayer,
    "Satellite View": satelliteLayer,
    "Hybrid View (Satellite + Labels)": hybridLayer.addTo(map),
    "Terrain View": terrainLayer
};

L.control.layers(layers).addTo(map);

// Pointer Marker
let pointerMarker = null;

// Autocomplete Suggestions and Search Functionality
const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('autocomplete-suggestions');
const searchButton = document.getElementById('search-button');

// Function to Place Marker Accurately
function placeMarker(lat, lon) {
    const position = [lat, lon];

    // If pointerMarker exists, update its position
    if (pointerMarker) {
        pointerMarker.setLatLng(position); // Move existing marker
    } else {
        pointerMarker = L.marker(position).addTo(map); // Create a new marker
    }

    // Fly to the specified position
    map.flyTo(position, 12, { animate: true, duration: 2 });
}

// Function to Handle Search Logic
function handleSearch(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            suggestionsBox.innerHTML = '';
            if (data.length > 0) {
                // Select the first result and place marker
                const firstResult = data[0];
                const lat = parseFloat(firstResult.lat);
                const lon = parseFloat(firstResult.lon);

                placeMarker(lat, lon); // Call function to place marker
                fetchLocationInfo(lat, lon); // Update location info
            } else {
                alert('No results found for the search query.');
            }
        })
        .catch(error => console.error('Error during search:', error));
}

// Search Input Event Listener
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => response.json())
            .then(data => {
                suggestionsBox.innerHTML = '';
                data.slice(0, 5).forEach((place) => {
                    const suggestion = document.createElement('div');
                    suggestion.textContent = place.display_name;
                    suggestion.addEventListener('click', () => {
                        searchInput.value = place.display_name;
                        suggestionsBox.innerHTML = '';

                        const lat = parseFloat(place.lat);
                        const lon = parseFloat(place.lon);

                        placeMarker(lat, lon); // Call function to place marker
                        fetchLocationInfo(lat, lon); // Update location info
                    });
                    suggestionsBox.appendChild(suggestion);
                });
            });
    } else {
        suggestionsBox.innerHTML = '';
    }
});

// Search Button Event Listener
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        handleSearch(query); // Call the search handling function
    } else {
        alert('Please enter a location to search.');
    }
});

// Fetch Location Info
const iconContainer = document.getElementById('icon-container');
const infoPopup = document.getElementById('info-popup');

const fetchLocationInfo = async (lat, lon) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const locationName = data.display_name || 'Unknown Location';
        infoPopup.querySelector('#popup-location-name').textContent = `Location: ${locationName}`;
        infoPopup.querySelector('#popup-location-coordinates').textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
        infoPopup.querySelector('#popup-famous-place').textContent = 'Famous Place: Placeholder';
        infoPopup.querySelector('#popup-famous-person').textContent = 'Famous Person: Placeholder';
        infoPopup.style.display = 'block';
    } catch (error) {
        console.error('Error fetching location info:', error);
    }
};

// Handle Map Clicks for Accurate Pointer Movement
map.on('click', (event) => {
    const { lat, lng } = event.latlng;

    placeMarker(lat, lng); // Use the same function to place marker
    fetchLocationInfo(lat, lng); // Fetch info for the clicked location
});

// Reset Popup when Icon is Clicked
iconContainer.addEventListener('mousedown', () => {
    infoPopup.style.display = 'none';
});
