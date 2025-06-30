// Initialize map
const map = L.map('map').setView([27.7, 85.3], 8); // Nepal area

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Global variables
let firstClicked = null;
let secondClicked = null;

let firstMarker = null;
let secondMarker = null;

let routeLayer = null;
let bufferLayer = null;

window.toolLayer = []; // Initialize toolLayer array

// Utility: clear previous route and buffer layers
function clearRouteAndBuffer() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
  if (bufferLayer) {
    map.removeLayer(bufferLayer);
    bufferLayer = null;
  }
}

// Step 1: Click any location and mark with its name
function activateTool1() {
  clearRouteAndBuffer();
  alert("Click on the map to mark a location and show its place name.");

  map.off('click'); // Remove previous click listeners

  map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Reverse geocoding to get location name using Nominatim API
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    const locationName = data.display_name || "Unknown Location";

    // Remove previous firstMarker if exists
    if (firstMarker) {
      map.removeLayer(firstMarker);
    }

    // Add marker with location name
    firstMarker = L.marker([lat, lng]).addTo(map).bindPopup(locationName).openPopup();

    firstClicked = turf.point([lng, lat], { name: locationName });
  });
}

// Step 2: Click another location to show route from first to second clicked location
function activateTool2() {
  if (!firstClicked) {
    alert("First click a location using Step 1.");
    return;
  }

  clearRouteAndBuffer();
  alert("Click another location to draw route from first to this location with distance.");

  map.off('click');

  map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Reverse geocoding to get second location name
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    const locationName = data.display_name || "Unknown Location";

    // Remove previous secondMarker if exists
    if (secondMarker) {
      map.removeLayer(secondMarker);
    }

    // Add marker for second location
    secondMarker = L.marker([lat, lng]).addTo(map).bindPopup(locationName).openPopup();

    secondClicked = turf.point([lng, lat], { name: locationName });

    // Calculate distance between first and second locations
    const distance = turf.distance(firstClicked, secondClicked, { units: 'kilometers' });

    // Draw line (route) between first and second
    const line = turf.lineString([firstClicked.geometry.coordinates, secondClicked.geometry.coordinates]);

    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    routeLayer = L.geoJSON(line, { color: 'Red' }).addTo(map);
    routeLayer.bindPopup(`Route from:<br>${firstClicked.properties.name}<br>to:<br>${secondClicked.properties.name}<br>Distance: ${distance.toFixed(2)} km`).openPopup();

    map.off('click');
  });
}

// Step 3: Show buffer around second clicked location
function activateTool3() {
  if (!secondClicked) {
    alert("First select the second location using Step 2.");
    return;
  }

  clearRouteAndBuffer();

  // Create 20 km buffer around second location
  const buffer = turf.buffer(secondClicked, 20, { units: 'kilometers' });

  bufferLayer = L.geoJSON(buffer, { color: 'red', opacity: 0.5 }).addTo(map);
  bufferLayer.bindPopup(`20 km Buffer around ${secondClicked.properties.name}`).openPopup();

  // Keep second marker visible
  if (secondMarker) {
    secondMarker.addTo(map).openPopup();
  }
}
