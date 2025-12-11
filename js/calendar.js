(function () {
    let currentDate = new Date();
    let currentData = [];
    let isInitialized = false;

    function init(containerId) {
        if (isInitialized) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        // Create Header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between p-6 border-b border-slate-200 bg-white';
        header.innerHTML = `
            <div class="flex items-center gap-4">
                <h2 id="calendarTitle" class="text-2xl font-bold text-slate-800"></h2>
                <div class="flex gap-1">
                    <button id="calPrev" class="p-1 rounded-full hover:bg-slate-100 text-slate-600">
                        <i data-lucide="chevron-left" class="w-6 h-6"></i>
                    </button>
                    <button id="calNext" class="p-1 rounded-full hover:bg-slate-100 text-slate-600">
                        <i data-lucide="chevron-right" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
            <div>
                <button id="calToday" class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Idag
                </button>
            </div>
        `;
        container.appendChild(header);

        // Create Grid Container
        const gridContainer = document.createElement('div');
        gridContainer.id = 'calendarGrid';
        gridContainer.className = 'flex-1 overflow-y-auto bg-white';
        container.appendChild(gridContainer);

        // Event Listeners
        document.getElementById('calPrev').addEventListener('click', () => changeMonth(-1));
        document.getElementById('calNext').addEventListener('click', () => changeMonth(1));
        document.getElementById('calToday').addEventListener('click', () => {
            currentDate = new Date();
            render();
        });

        isInitialized = true;
    }

    function changeMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        render();
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        // 0 = Sunday, 1 = Monday. We want Monday as 0 index for our grid if we start with Mon.
        // JS Date: 0=Sun, 1=Mon...6=Sat.
        // We want 0=Mon...6=Sun.
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }

    function render(installations) {
        if (installations) currentData = installations;

        const grid = document.getElementById('calendarGrid');
        const title = document.getElementById('calendarTitle');
        if (!grid || !title) return;

        // Update Title
        const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
        title.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        // Clear Grid
        grid.innerHTML = '';

        // Render Day Headers
        const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
        const headerRow = document.createElement('div');
        headerRow.className = 'grid grid-cols-7 border-b border-slate-200 bg-slate-50';
        days.forEach(day => {
            const el = document.createElement('div');
            el.className = 'py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide';
            el.textContent = day;
            headerRow.appendChild(el);
        });
        grid.appendChild(headerRow);

        // Render Days
        const monthBody = document.createElement('div');
        monthBody.className = 'grid grid-cols-7 auto-rows-fr h-full'; // Fill height

        // Calculate Grid
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        // Prev Month filler
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = 0; i < firstDay; i++) {
            const dayNum = prevMonthDays - firstDay + 1 + i;
            monthBody.appendChild(createDayCell(dayNum, true));
        }

        // Current Month
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
            monthBody.appendChild(createDayCell(i, false, isToday, year, month));
        }

        // Next Month filler (to fill 6 rows approx or just til end of week)
        const totalCells = firstDay + daysInMonth;
        const remaining = 42 - totalCells; // 6 rows * 7 cols = 42
        for (let i = 1; i <= remaining; i++) {
            monthBody.appendChild(createDayCell(i, true));
        }

        grid.appendChild(monthBody);

        // Re-init icons
        if (window.lucide) window.lucide.createIcons();
    }

    function createDayCell(dayNum, isOtherMonth, isToday = false, year, month) {
        const cell = document.createElement('div');
        cell.className = `min-h-[120px] p-2 border-b border-r border-slate-100 relative group transition-colors ${isOtherMonth ? 'bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-50/50'}`;

        // Date Number
        const dateEl = document.createElement('span');
        dateEl.className = `absolute top-2 right-2 text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md' : ''}`;
        dateEl.textContent = dayNum;
        cell.appendChild(dateEl);

        // Content
        if (!isOtherMonth && year && month !== undefined) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            // Find events
            const events = currentData.filter(i => i.date === dateStr);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'mt-8 flex flex-col gap-1.5';

            events.forEach(ev => {
                const evEl = document.createElement('div');
                // Style based on status
                let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (ev.status === 'completed') colorClass = 'bg-green-50 text-green-700 border-green-200';
                if (ev.status === 'planned') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

                evEl.className = `text-[10px] p-1.5 rounded border ${colorClass} cursor-pointer truncate hover:opacity-80 transition-opacity`;

                const techName = ev.technician ? ev.technician.split(' ')[0] : '?';

                evEl.innerHTML = `
                    <div class="font-semibold truncate">${ev.customer}</div>
                    ${ev.technician ? `<div class="flex items-center gap-1 mt-0.5 opacity-75"><i data-lucide="user" class="w-3 h-3"></i> ${techName}</div>` : ''}
                 `;

                // Add click handler to open assignment panel (or view details)
                evEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Trigger same action as clicking list item
                    if (window.WP && window.WP.ui && window.WP.ui.renderList) {
                        // We need a way to trigger the map flyTo or open assign panel. 
                        // For now let's just log or maybe trigger the map flyTo if map is hidden?
                        // Actually user might want to edit.
                        // Let's reuse the handleAssignTechnician if pending, or just show details.
                        // Ideally we switch to map view and zoom? Or just open edit modal?
                        // Let's assume generic "card click" behavior for now.
                        console.log("Clicked event", ev);
                        // TODO: Maybe implement a 'quick view' modal or switch to map. 
                        // For now, let's keep it simple.
                    }
                });

                eventsContainer.appendChild(evEl);
            });
            cell.appendChild(eventsContainer);
        }

        return cell;
    }

    window.WP = window.WP || {};
    window.WP.calendar = {
        init,
        render
    };
})();
