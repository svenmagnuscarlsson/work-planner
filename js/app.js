(function () {
    let allInstallations = []; // Cache
    let currentFilter = 'all';
    let searchQuery = '';

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
        allInstallations = await db.getInstallations();

        // 3. Render UI
        refreshUI(allInstallations);

        // 4. Listeners
        setupFilters();
        setupFilters();
        setupMobilenav();
        setupSearch();
        ui.initResizablePanel();

        // 5. Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function getFilteredData() {
        let data = allInstallations;

        // Apply status filter
        if (currentFilter !== 'all') {
            data = data.filter(i => i.status === currentFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            data = data.filter(i =>
                i.customer.toLowerCase().includes(query) ||
                i.address.toLowerCase().includes(query) ||
                (i.technician && i.technician.toLowerCase().includes(query)) ||
                (i.category && i.category.toLowerCase().includes(query))
            );
        }

        return data;
    }

    function refreshUI(data) {
        const ui = window.WP.ui;
        const map = window.WP.map;

        ui.renderList(data, 'installationList', (inst) => {
            map.flyTo(inst.lat, inst.lng);
        }, async () => {
            // Delete callback - reload all data
            allInstallations = await window.WP.db.getInstallations();
            refreshUI(getFilteredData());
        });
        map.renderMarkers(data, (inst) => {
            console.log("Clicked marker:", inst.customer);
        });
        ui.updateStats(data.length);
    }

    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = e.target.value;
                refreshUI(getFilteredData());
            }, 300); // 300ms debounce
        });
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
                currentFilter = btn.dataset.filter;
                refreshUI(getFilteredData());
            });
        });
    }

    function setupModal() {
        const modal = document.getElementById('newInstallationModal');
        const openBtn = document.getElementById('addInstallationBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelModalBtn');
        const form = document.getElementById('newInstallationForm');

        if (window.WP.setupAddressAutocomplete) {
            window.WP.setupAddressAutocomplete('newAddress');
        }

        function open() {
            modal.classList.remove('hidden');
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

                const addressInput = document.getElementById('newAddress');

                // Use coordinates from autocomplete if available
                if (addressInput && addressInput.dataset.lat && addressInput.dataset.lng) {
                    lat = parseFloat(addressInput.dataset.lat);
                    lng = parseFloat(addressInput.dataset.lng);
                } else {
                    // Fallback to manual Geocoding
                    const coords = await window.WP.map.geocodeAddress(address);

                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                    } else {
                        // Toast user if address not found
                        if (window.WP.ui.showToast) {
                            window.WP.ui.showToast(`Kunde inte hitta exakt position för "${address}". Kontrollera stavningen och försök igen.`, 'error', 5000);
                        } else {
                            alert(`Kunde inte hitta exakt position för "${address}".`);
                        }

                        // Strict validation: Stop saving
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        return;
                    }
                }

                const newInst = {
                    id: crypto.randomUUID(),
                    customer: formData.get('customer'),
                    address: address,
                    lat: lat,
                    lng: lng,
                    status: 'pending',
                    technician: null,
                    date: new Date().toISOString().split('T')[0],
                    category: formData.get('category') || 'Villalarm',
                    estimatedTime: (parseInt(formData.get('estimatedTime')) * 60) || 120 // Convert hours to minutes
                };

                await window.WP.db.saveInstallation(newInst);

                // Refresh data
                allInstallations = await window.WP.db.getInstallations();
                refreshUI(getFilteredData());

                // Fly to new location if available
                if (lat && lng) {
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

        if (toggleSidebar && sidebar) {
            toggleSidebar.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('-translate-x-full');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 1024 && !sidebar.contains(e.target) && !toggleSidebar.contains(e.target)) {
                    sidebar.classList.add('-translate-x-full');
                }
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
        const panel = document.getElementById('assignmentPanel');
        const closeBtn = document.getElementById('closeAssignPanelBtn');
        const cancelBtn = document.getElementById('cancelAssignBtn');
        const confirmBtn = document.getElementById('confirmAssignBtn');

        // Inputs
        const nameInput = document.getElementById('assignCustomerName');
        const dateInput = document.getElementById('assignDate');
        const categorySelect = document.getElementById('assignCategory');
        const timeInput = document.getElementById('assignEstimatedTime');

        if (closeBtn) closeBtn.addEventListener('click', window.WP.ui.closeAssignmentPanel);
        if (cancelBtn) cancelBtn.addEventListener('click', window.WP.ui.closeAssignmentPanel);

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const currentId = panel.dataset.currentId;
                if (!currentId) return;

                const selectedTech = document.querySelector('input[name="technician"]:checked');
                const dateVal = dateInput.value;
                const customerVal = nameInput.value;
                const categoryVal = categorySelect.value;
                const timeVal = timeInput.value;
                const db = window.WP.db;

                // Fallback to finding in cache
                const cachedInst = allInstallations.find(i => i.id === currentId);

                if (cachedInst) {
                    cachedInst.customer = customerVal;
                    cachedInst.category = categoryVal || 'Villalarm';
                    cachedInst.estimatedTime = (parseInt(timeVal) * 60) || 120; // Convert hours to minutes

                    if (dateVal) cachedInst.date = dateVal;
                    if (selectedTech) cachedInst.technician = selectedTech.value;

                    // Update status if pending and fully assigned
                    if (cachedInst.status === 'pending' && cachedInst.technician && cachedInst.date) {
                        cachedInst.status = 'planned';
                    }

                    await db.saveInstallation(cachedInst);

                    // Refresh UI
                    window.WP.ui.closeAssignmentPanel();
                    refreshUI(getFilteredData());
                }
            });
        }
    }

    // Navigation Logic
    function setupNavigation() {
        const navOverview = document.getElementById('nav-overview');
        const navMap = document.getElementById('nav-map');
        const navCal = document.getElementById('nav-calendar');
        const navTech = document.getElementById('nav-tech');
        const navStats = document.getElementById('nav-stats');
        const mapContainer = document.getElementById('map').parentElement;
        const listPanel = document.getElementById('listPanel');
        const calendarView = document.getElementById('calendarView');
        const technicianView = document.getElementById('technicianView');
        const statisticsView = document.getElementById('statisticsView');

        const allNavItems = [navOverview, navMap, navCal, navTech, navStats];

        function hideAll() {
            mapContainer.classList.add('hidden');
            listPanel.classList.add('hidden');
            calendarView.classList.add('hidden');
            if (technicianView) technicianView.classList.add('hidden');
            if (statisticsView) statisticsView.classList.add('hidden');

            allNavItems.forEach(el => {
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

        function switchToOverview() {
            hideAll();
            mapContainer.classList.remove('hidden');
            listPanel.classList.remove('hidden');
            setActive(navOverview);
            window.WP.map.initMap('map').invalidateSize();
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

        function switchToStatistics() {
            hideAll();
            if (statisticsView) statisticsView.classList.remove('hidden');
            setActive(navStats);
            if (window.WP.statistics) {
                window.WP.statistics.init('statisticsView');
                window.WP.statistics.render(allInstallations);
            }
        }

        if (navOverview) navOverview.addEventListener('click', (e) => { e.preventDefault(); switchToOverview(); });
        if (navMap) navMap.addEventListener('click', (e) => { e.preventDefault(); switchToMap(); });
        if (navCal) navCal.addEventListener('click', (e) => { e.preventDefault(); switchToCalendar(); });
        if (navTech) navTech.addEventListener('click', (e) => { e.preventDefault(); switchToTechnicians(); });
        if (navStats) navStats.addEventListener('click', (e) => { e.preventDefault(); switchToStatistics(); });
    }

    // Start
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupModal();
        setupAssignmentPanel();
        setupNavigation();
    });
})();
