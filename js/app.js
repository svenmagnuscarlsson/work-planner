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

    function setupModal() {
        const modal = document.getElementById('newInstallationModal');
        const openBtn = document.getElementById('addInstallationBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelModalBtn');
        const form = document.getElementById('newInstallationForm');

        function open() {
            modal.classList.remove('hidden');
            // Re-init hidden icons if needed, though they are usually fine
        }

        function close() {
            modal.classList.add('hidden');
            form.reset();
        }

        if (openBtn) openBtn.addEventListener('click', open);
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (cancelBtn) cancelBtn.addEventListener('click', close);

        // Close on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'modalBackdrop') close();
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = form.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i> Sparar...';
                if (window.lucide) window.lucide.createIcons();

                const formData = new FormData(form);
                const address = formData.get('address');
                let lat, lng;

                // Attempt Geocoding
                const coords = await window.WP.map.geocodeAddress(address);

                if (coords) {
                    lat = coords.lat;
                    lng = coords.lng;
                } else {
                    // Fallback to map center with slight random offset
                    const mapCenter = window.WP.map.initMap('map').getCenter();
                    lat = mapCenter.lat + (Math.random() - 0.5) * 0.002;
                    lng = mapCenter.lng + (Math.random() - 0.5) * 0.002;
                }

                const newInst = {
                    id: crypto.randomUUID(),
                    customer: formData.get('customer'),
                    address: address,
                    lat: lat,
                    lng: lng,
                    status: 'pending',
                    technician: null,
                    date: new Date().toISOString().split('T')[0]
                };

                await window.WP.db.saveInstallation(newInst);

                // Refresh data
                allInstallations = await window.WP.db.getInstallations();
                refreshUI(allInstallations);

                // Fly to new location if geocoded successfully
                if (coords) {
                    window.WP.map.flyTo(lat, lng);
                }

                close();
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
        }
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

    function setupAssignmentPanel() {
        const cancelBtn = document.getElementById('cancelAssignBtn');
        const closeBtn = document.getElementById('closeAssignPanelBtn');
        const saveBtn = document.getElementById('confirmAssignBtn');
        const panel = document.getElementById('assignmentPanel');

        if (cancelBtn) cancelBtn.addEventListener('click', () => window.WP.ui.closeAssignmentPanel());
        if (closeBtn) closeBtn.addEventListener('click', () => window.WP.ui.closeAssignmentPanel());

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const currentId = panel.dataset.currentId;
                if (!currentId) return;

                const selectedTech = document.querySelector('input[name="technician"]:checked');
                const dateVal = document.getElementById('assignDate').value;

                const customerVal = document.getElementById('assignCustomerName').value;

                if (!customerVal) {
                    alert("Kundnamn får inte vara tomt.");
                    return;
                }

                // Fetch, Update, Save
                const db = window.WP.db;
                const inst = await db.getInstallation(currentId); // Need to expose get record logic or fetch from cache
                // Note: getInstallation wasn't explicitly exposed in global, let's fix that or filter from cache

                // Fallback to finding in cache
                const cachedInst = allInstallations.find(i => i.id === currentId);

                if (cachedInst) {
                    cachedInst.customer = customerVal;

                    if (dateVal) cachedInst.date = dateVal;
                    if (selectedTech) cachedInst.technician = selectedTech.value;

                    // Update status if pending and fully assigned
                    if (cachedInst.status === 'pending' && cachedInst.technician && cachedInst.date) {
                        cachedInst.status = 'planned';
                    }

                    await db.saveInstallation(cachedInst);

                    // Refresh UI
                    window.WP.ui.closeAssignmentPanel();
                    refreshUI(allInstallations); // Updates list and map
                }
            });
        }
    }

    // Navigation Logic
    function setupNavigation() {
        const navMap = document.getElementById('nav-map');
        const navCal = document.getElementById('nav-calendar');
        const navTech = document.getElementById('nav-tech');
        const mapContainer = document.getElementById('map').parentElement;
        const listPanel = document.getElementById('listPanel');
        const calendarView = document.getElementById('calendarView');
        const technicianView = document.getElementById('technicianView');

        function hideAll() {
            mapContainer.classList.add('hidden');
            listPanel.classList.add('hidden');
            calendarView.classList.add('hidden');
            if (technicianView) technicianView.classList.add('hidden');

            [navMap, navCal, navTech].forEach(el => {
                if (el) {
                    el.classList.remove('bg-blue-50', 'text-blue-700');
                    el.classList.add('text-slate-600', 'hover:bg-slate-50', 'hover:text-slate-900');
                }
            });
        }

        function setActive(el) {
            if (el) {
                el.classList.add('bg-blue-50', 'text-blue-700');
                el.classList.remove('text-slate-600', 'hover:bg-slate-50', 'hover:text-slate-900');
            }
        }

        function switchToMap() {
            hideAll();
            mapContainer.classList.remove('hidden');
            listPanel.classList.remove('hidden');
            setActive(navMap);
            window.WP.map.initMap('map').invalidateSize();
        }

        function switchToCalendar() {
            hideAll();
            calendarView.classList.remove('hidden');
            setActive(navCal);
            if (window.WP.calendar) {
                window.WP.calendar.init('calendarView');
                window.WP.calendar.render(allInstallations);
            }
        }

        function switchToTechnicians() {
            hideAll();
            if (technicianView) technicianView.classList.remove('hidden');
            setActive(navTech);
            if (window.WP.technicians) {
                window.WP.technicians.init('technicianView');
                window.WP.technicians.render();
            }
        }

        if (navMap) navMap.addEventListener('click', (e) => { e.preventDefault(); switchToMap(); });
        if (navCal) navCal.addEventListener('click', (e) => { e.preventDefault(); switchToCalendar(); });
        if (navTech) navTech.addEventListener('click', (e) => { e.preventDefault(); switchToTechnicians(); });
    }

    // Start
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupModal(); // Init modal logic
        setupAssignmentPanel(); // Init assignment logic
        setupNavigation(); // Init nav logic
    });
})();
