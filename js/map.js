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

        // Fix for white lines - ensure map tiles render correctly
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 100);

        return mapInstance;
    }

    function getCategoryIconSVG(category) {
        // Simple SVGs for the marker icons (24x24) - scaled down in CSS
        // Using Lucide-like paths
        switch (category) {
            case 'Villalarm':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
            case 'Företagslarm':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
            case 'Kameraövervakning':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
            case 'Service':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
            default:
                return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
        }
    }

    function renderMarkers(installations, onClickCallback) {
        if (!mapInstance || !markersLayer) return;

        markersLayer.clearLayers();

        installations.forEach(inst => {
            const color = getStatusColor(inst.status);
            const iconSvg = getCategoryIconSVG(inst.category);
            const zIndexOffset = inst.status === 'completed' ? 0 : 1000;

            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div class="relative">
                        <div class="marker-pin" style="background-color: ${color}">
                            <div class="marker-icon text-white">
                                ${iconSvg}
                            </div>
                        </div>
                        <div class="marker-label">${inst.customer}</div>
                    </div>
                `,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });

            const marker = L.marker([inst.lat, inst.lng], {
                icon: customIcon,
                zIndexOffset: zIndexOffset
            })
                .on('click', () => {
                    onClickCallback(inst);
                    mapInstance.flyTo([inst.lat, inst.lng], 15, { duration: 0.8, easeLinearity: 0.25 }); // Animate centering
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
