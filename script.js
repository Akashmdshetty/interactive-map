// Initialize Map
const map = L.map('map', {
    zoomControl: false // Disable default zoom control to reposition it
}).setView([20, 0], 2);

// Add Layers
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google contributors'
});
const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '© OpenTopoMap contributors' });
const hybridLayer = L.layerGroup([satelliteLayer, streetLayer]);

// Add Layer Control
L.control.layers({ 'Street View': streetLayer, 'Hybrid View': hybridLayer, 'Terrain View': terrainLayer }).addTo(map);

// Add Custom Zoom Control to the Bottom-Right Corner
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Pointer Marker Logic
let pointerMarker = L.marker([20, 0]).addTo(map); // Add initial pointer marker to the map

// Draggable Icon Logic
const iconContainer = document.getElementById('icon-container');
const infoPopup = document.getElementById('info-popup');
let isDragging = false;

// Set Initial Icon Position in the Bottom-Left Corner
iconContainer.style.left = '20px';
iconContainer.style.bottom = '20px';

// Make Icon Mobile (Draggable)
iconContainer.addEventListener('mousedown', () => {
    isDragging = true;
    infoPopup.style.display = 'none'; // Hide popup while dragging
});

document.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const mapBounds = map.getContainer().getBoundingClientRect();
        const iconBounds = iconContainer.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - iconBounds.width / 2, mapBounds.left), mapBounds.right - iconBounds.width);
        const y = Math.min(Math.max(event.clientY - iconBounds.height / 2, mapBounds.top), mapBounds.bottom - iconBounds.height);

        // Update Icon Position
        iconContainer.style.left = `${x - mapBounds.left}px`;
        iconContainer.style.top = `${y - mapBounds.top}px`;

        // Calculate lat/lon based on current position
        const point = map.containerPointToLatLng([x - mapBounds.left, y - mapBounds.top]);
        updateInfoPopup(point.lat, point.lng); // Update popup info dynamically
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => {
        infoPopup.style.display = 'block'; // Show popup after dragging ends
    }, 200); // Delay to simulate smoothness
});

// Function to Update Info Popup Based on Pointer Position
function updateInfoPopup(lat, lon) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then((response) => response.json())
        .then((data) => {
            const locationName = data.display_name || 'Unknown Location';
            infoPopup.querySelector('#popup-location-name').textContent = `Location: ${locationName}`;
            infoPopup.querySelector('#popup-location-coordinates').textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
            infoPopup.querySelector('#popup-detailed-coordinates').textContent = `Coordinates: (${lat}, ${lon})`;
        })
        .catch((error) => console.error('Error fetching location info:', error));
}

// Handle Map Click to Move Pointer
map.on('click', (event) => {
    const { lat, lng } = event.latlng;

    // Move Pointer to the Clicked Location
    pointerMarker.setLatLng([lat, lng]);

    // Update Popup Info Based on Pointer Location
    updateInfoPopup(lat, lng);
});

// Search Suggestions and Functionality
const searchInput = document.getElementById('search-input');
const suggestionsContainer = document.getElementById('suggestions-container');
const searchButton = document.getElementById('search-button');

// Fetch Suggestions
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length > 2) { // Start fetching after 3 characters
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then((response) => response.json())
            .then((data) => {
                suggestionsContainer.innerHTML = ''; // Clear previous suggestions
                suggestionsContainer.style.display = 'block';

                data.forEach((item) => {
                    const suggestion = document.createElement('div');
                    suggestion.textContent = item.display_name;
                    suggestion.dataset.lat = item.lat;
                    suggestion.dataset.lon = item.lon;
                    suggestionsContainer.appendChild(suggestion);

                    // Handle Suggestion Click
                    suggestion.addEventListener('click', () => {
                        searchInput.value = item.display_name; // Update search input
                        suggestionsContainer.style.display = 'none'; // Hide suggestions
                        map.flyTo([item.lat, item.lon], 12); // Zoom to location
                        pointerMarker.setLatLng([item.lat, item.lon]); // Move pointer
                        updateInfoPopup(item.lat, item.lon); // Update popup
                    });
                });
            })
            .catch((error) => console.error('Error fetching suggestions:', error));
    } else {
        suggestionsContainer.style.display = 'none'; // Hide container for short queries
    }
});

// Hide Suggestions on Outside Click
document.addEventListener('click', (event) => {
    if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
        suggestionsContainer.style.display = 'none';
    }
});

// Search Button Functionality
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.flyTo([lat, lon], 12); // Zoom to searched location
                    pointerMarker.setLatLng([lat, lon]); // Move pointer
                    updateInfoPopup(lat, lon); // Update popup
                } else {
                    alert('No results found.');
                }
            })
            .catch((error) => console.error('Error during search:', error));
    }
});

// Sidebar Toggle Logic
const slider = document.getElementById('slider');
const toggleSliderButton = document.getElementById('toggle-slider');

toggleSliderButton.addEventListener('click', () => {
    if (slider.style.left === '0px') {
        slider.style.left = '-250px'; // Hide sidebar
    } else {
        slider.style.left = '0px'; // Show sidebar
    }
});
