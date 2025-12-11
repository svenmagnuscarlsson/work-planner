(function () {
    let allInstallations = []; // Cache

    async function init() {
        console.log("Initializing App...");

        // Access modules from global WP namespace
        const db = window.WP.db;
        const map = window.WP.map;
        const ui = window.WP.ui;

        if (!db || !map || !ui) {
            console.error("One or more modules failed to load.");
            return;
        }

        // 1. Init Map
        map.initMap('map');

        // 2. Init DB & Data
        await db.seedDataIfEmpty();
        allInstallations = await db.getInstallations();

        // 3. Render UI
        refreshUI(allInstallations);

        // 4. Listeners
        setupFilters();
        setupMobilenav();

        // 5. Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function refreshUI(data) {
        const ui = window.WP.ui;
        const map = window.WP.map;

        ui.renderList(data, 'installationList', (inst) => {
            map.flyTo(inst.lat, inst.lng);
        });
        map.renderMarkers(data, (inst) => {
            console.log("Clicked marker:", inst.customer);
        });
        ui.updateStats(data.length);
    }

    function setupFilters() {
        const battons = document.querySelectorAll('[data-filter]');
        battons.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI Toggle
                battons.forEach(b => {
                    b.classList.remove('bg-slate-100', 'ring-2', 'ring-blue-500', 'active-filter');
                    b.classList.add('bg-white', 'border', 'border-slate-200');
                });
                btn.classList.remove('bg-white', 'border', 'border-slate-200');
                btn.classList.add('bg-slate-100', 'ring-2', 'ring-blue-500', 'active-filter');

                // Logic
                const filter = btn.dataset.filter;
                const filtered = filter === 'all'
                    ? allInstallations
                    : allInstallations.filter(i => i.status === filter);

                refreshUI(filtered);
            });
        });
    }

    function setupMobilenav() {
        const listPanel = document.getElementById('listPanel');
        const toggleSidebar = document.getElementById('toggleSidebar');
        const sidebar = document.getElementById('sidebar');
        const openListBtn = document.getElementById('openListPanel');
        const closeListBtn = document.getElementById('closeListPanel');

        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
                sidebar.classList.toggle('absolute');
            });
        }

        if (openListBtn) {
            openListBtn.addEventListener('click', () => {
                listPanel.classList.remove('-translate-x-full');
            });
        }

        if (closeListBtn) {
            closeListBtn.addEventListener('click', () => {
                listPanel.classList.add('-translate-x-full');
            });
        }
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
