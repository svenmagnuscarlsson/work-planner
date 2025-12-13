(async function () {
    const currentUserEmail = localStorage.getItem('currentUser');

    // Auth Check
    if (!currentUserEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Update Header
    document.getElementById('currentUserEmail').textContent = currentUserEmail;

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // State
    const tabList = document.getElementById('tabList');
    const tabCalendar = document.getElementById('tabCalendar');
    const tabMap = document.getElementById('tabMap');

    const listView = document.getElementById('listView');
    const calendarView = document.getElementById('calendarView');
    const mapView = document.getElementById('mapView');

    let mapInitialized = false;
    let mapInstance = null;
    let markers = [];
    let currentJobs = []; // Store jobs here for shared access

    function switchTab(tab) {
        // Reset all tabs
        [tabList, tabCalendar, tabMap].forEach(el => {
            el.classList.remove('tab-active');
            el.classList.add('tab-inactive');
        });

        // Reset all views
        [listView, calendarView, mapView].forEach(el => {
            el.classList.remove('active');
        });

        if (tab === 'list') {
            tabList.classList.add('tab-active');
            tabList.classList.remove('tab-inactive');
            listView.classList.add('active');
        } else if (tab === 'calendar') {
            tabCalendar.classList.add('tab-active');
            tabCalendar.classList.remove('tab-inactive');
            calendarView.classList.add('active');
            renderCalendar(currentJobs);
        } else {
            tabMap.classList.add('tab-active');
            tabMap.classList.remove('tab-inactive');
            mapView.classList.add('active');

            if (!mapInitialized) {
                initMap();
                mapInitialized = true;
            } else {
                setTimeout(() => {
                    if (mapInstance) {
                        mapInstance.invalidateSize();
                        fitBounds();
                    }
                }, 100);
            }
        }
    }

    tabList.addEventListener('click', () => switchTab('list'));
    tabCalendar.addEventListener('click', () => switchTab('calendar'));
    tabMap.addEventListener('click', () => switchTab('map'));

    // Data Loading
    const technicians = await window.WP.db.getTechnicians();
    const currentTech = technicians.find(t => t.email.toLowerCase() === currentUserEmail.toLowerCase());

    if (!currentTech) {
        document.getElementById('listView').innerHTML = `
            <div class="text-center py-12 px-4">
                <div class="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800">Konto ej hittat</h3>
                <p class="text-slate-500 mt-2">Dinu e-post matchar inte någon registrerad tekniker.</p>
                <p class="text-sm text-slate-400 mt-4">Kontakta administratören.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Fetch and Filter Jobs
    async function loadJobs() {
        const allInstallations = await window.WP.db.getInstallations();

        // Filter by Technician Name
        currentJobs = allInstallations.filter(inst => inst.technician === currentTech.name);

        renderJobs(currentJobs);

        // If map is already init
        if (mapInitialized) {
            updateMapMarkers();
        }
    }

    function renderJobs(jobs) {
        const container = document.getElementById('listView');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="bg-slate-100 text-slate-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="clipboard-check" class="w-8 h-8"></i>
                    </div>
                    <p class="text-slate-500">Inga uppdrag tilldelade.</p>
                </div>`;
            return;
        }

        // Sort: Pending/Planned first, then Completed
        jobs.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return 0;
        });

        jobs.forEach(job => container.appendChild(createJobCard(job)));

        lucide.createIcons();
    }

    function createJobCard(job) {
        const isCompleted = job.status === 'completed';
        const card = document.createElement('div');
        card.className = `p-4 rounded-xl border mb-3 shadow-sm transition-all ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-100 shadow-md'
            }`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${isCompleted ? 'bg-green-100 text-green-700' :
                job.status === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }">
                    ${isCompleted ? 'Klar' : job.status === 'planned' ? 'Planerad' : 'Väntande'}
                </span>
                <span class="text-xs text-slate-400 flex items-center gap-1">
                    <i data-lucide="clock" class="w-3 h-3"></i>
                    ${formatTime(job.estimatedTime)}
                </span>
            </div>
            
            <h3 class="font-bold text-slate-900 text-lg mb-1">${job.customer}</h3>
            
            <a href="https://maps.google.com/?q=${encodeURIComponent(job.address)}" target="_blank" 
               class="flex items-center gap-2 text-slate-500 text-sm mb-4 hover:text-blue-600 transition-colors">
                <i data-lucide="map-pin" class="w-4 h-4"></i>
                ${job.address}
            </a>

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                <span class="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    ${job.category}
                </span>
                
                ${!isCompleted ? `
                    <button class="complete-btn flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-600/20 active:scale-95 transition-transform">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        Klarmarkera
                    </button>
                ` : `
                    <span class="text-green-600 text-sm font-medium flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        Klart
                    </span>
                `}
            </div>
        `;

        if (!isCompleted) {
            card.querySelector('.complete-btn').addEventListener('click', async () => {
                if (confirm('Markera jobbet som utfört?')) {
                    job.status = 'completed';
                    await window.WP.db.saveInstallation(job);
                    loadJobs(); // Refresh
                }
            });
        }

        return card;
    }

    function renderCalendar(jobs) {
        const container = document.getElementById('calendarContent');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-400 py-10">Inga jobb att visa i kalendern.</div>`;
            return;
        }

        // Group by Date
        const groups = {};
        jobs.forEach(job => {
            const date = job.date || 'Odaterad'; // Fallback if no date
            if (!groups[date]) groups[date] = [];
            groups[date].push(job);
        });

        // Sort Dates
        const sortedDates = Object.keys(groups).sort();

        sortedDates.forEach(date => {
            const dateJobs = groups[date];

            // Header
            const header = document.createElement('div');
            header.className = 'sticky top-0 bg-slate-50 pt-2 pb-2 z-10';

            let dateLabel = date;
            const d = new Date(date);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date === today.toISOString().split('T')[0]) dateLabel = 'Idag';
            else if (date === tomorrow.toISOString().split('T')[0]) dateLabel = 'Imorgon';

            header.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <div class="h-8 w-1 bg-blue-500 rounded-full"></div>
                    <h2 class="text-lg font-bold text-slate-800">${dateLabel}</h2>
                    <span class="text-xs text-slate-500 font-normal">(${dateJobs.length} jobb)</span>
                </div>
            `;
            container.appendChild(header);

            // Jobs
            const list = document.createElement('div');
            list.className = 'space-y-4 mb-6 pl-3 border-l text-sm border-slate-200 ml-1.5';

            dateJobs.forEach(job => {
                const card = createJobCard(job);
                card.className = card.className.replace('mb-3', 'mb-0'); // tighter spacing
                list.appendChild(card);
            });
            container.appendChild(list);
        });

        lucide.createIcons();
    }

    function formatTime(minutes) {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}t ${mins}m`;
        if (hours > 0) return `${hours}t`;
        return `${mins}m`;
    }

    // Map Logic
    function initMap() {
        if (mapInstance) return;

        mapInstance = L.map('map').setView([59.3293, 18.0686], 11); // Stockholm default

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapInstance);

        updateMapMarkers();
    }

    async function updateMapMarkers() {
        if (!mapInstance || !currentJobs) return;

        // Clear existing
        markers.forEach(m => mapInstance.removeLayer(m));
        markers = [];

        const group = L.featureGroup();
        let validMarkers = 0;

        currentJobs.forEach(job => {
            let lat = job.lat;
            let lng = job.lng;

            if (!lat || !lng) {
                return;
            }

            const marker = L.marker([lat, lng])
                .bindPopup(`<b>${job.customer}</b><br>${job.address}`)
                .addTo(mapInstance);

            markers.push(marker);
            group.addLayer(marker);
            validMarkers++;
        });

        if (validMarkers > 0) {
            mapInstance.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Fit bounds calculation
    function fitBounds() {
        if (markers.length > 0 && mapInstance) {
            const group = L.featureGroup(markers);
            mapInstance.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Initial Load
    loadJobs();

})();
