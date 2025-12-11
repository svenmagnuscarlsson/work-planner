(function () {
    let mapInstance = null;
    let markersLayer = null;

    function initMap(elementId, center = [59.3293, 18.0686], zoom = 12) {
        if (mapInstance) return mapInstance;

        mapInstance = L.map(elementId, {
            zoomControl: false
        }).setView(center, zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapInstance);

        L.control.zoom({
            position: 'bottomright'
        }).addTo(mapInstance);

        markersLayer = L.layerGroup().addTo(mapInstance);

        return mapInstance;
    }

    function renderMarkers(installations, onClickCallback) {
        if (!mapInstance || !markersLayer) return;

        markersLayer.clearLayers();

        installations.forEach(inst => {
            const color = getStatusColor(inst.status);

            const customIcon = L.divIcon({
                className: 'custom-pin',
                html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const marker = L.marker([inst.lat, inst.lng], { icon: customIcon })
                .on('click', () => {
                    onClickCallback(inst);
                    mapInstance.flyTo([inst.lat, inst.lng], 14, { duration: 0.5 });
                });

            marker.bindTooltip(`<b>${inst.customer}</b><br>${inst.status}`, {
                direction: 'top',
                offset: [0, -10]
            });

            markersLayer.addLayer(marker);
        });
    }

    function flyTo(lat, lng, zoom = 14) {
        if (mapInstance) {
            mapInstance.flyTo([lat, lng], zoom, { duration: 1.0 });
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'completed': return '#22c55e';
            case 'planned': return '#3b82f6';
            default: return '#ef4444';
        }
    }

    async function geocodeAddress(address) {
        if (!address) return null;
        try {
            // Using OpenStreetMap Nominatim API
            // Note: Respect their Usage Policy (max 1 req/sec). 
            // In a production app, use a proper geocoding service / proxy.
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'sv' // Prefer Swedish results
                }
            });

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (err) {
            console.error("Geocoding error:", err);
            return null;
        }
    }

    window.WP = window.WP || {};
    window.WP.map = {
        initMap,
        renderMarkers,
        flyTo,
        geocodeAddress
    };
})();
