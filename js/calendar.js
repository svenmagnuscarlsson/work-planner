(function () {
    let currentDate = new Date();
    let currentData = [];
    let isInitialized = false;
    let currentView = 'month'; // 'month' or 'week'

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
            <div class="flex items-center gap-2">
                <div class="flex bg-slate-100 rounded-lg p-1">
                    <button id="viewMonth" class="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm transition-all">
                        Månad
                    </button>
                    <button id="viewWeek" class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-800 transition-all">
                        Vecka
                    </button>
                </div>
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
        document.getElementById('calPrev').addEventListener('click', () => changeDate(-1));
        document.getElementById('calNext').addEventListener('click', () => changeDate(1));
        document.getElementById('calToday').addEventListener('click', () => {
            currentDate = new Date();
            render();
        });

        document.getElementById('viewMonth').addEventListener('click', () => switchView('month'));
        document.getElementById('viewWeek').addEventListener('click', () => switchView('week'));

        isInitialized = true;
    }

    function switchView(view) {
        currentView = view;

        const monthBtn = document.getElementById('viewMonth');
        const weekBtn = document.getElementById('viewWeek');

        if (view === 'month') {
            monthBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            monthBtn.classList.remove('text-slate-600');
            weekBtn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            weekBtn.classList.add('text-slate-600');
        } else {
            weekBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            weekBtn.classList.remove('text-slate-600');
            monthBtn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
            monthBtn.classList.add('text-slate-600');
        }

        render();
    }

    function changeDate(delta) {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + delta);
        } else {
            currentDate.setDate(currentDate.getDate() + (delta * 7));
        }
        render();
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function formatTime(minutes) {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
        if (hours > 0) return `${hours}h`;
        return `${mins}min`;
    }

    function render(installations) {
        if (installations) {
            // Filter out 'pending' installations as requested
            currentData = installations.filter(inst => inst.status !== 'pending');
        }

        if (currentView === 'week') {
            renderWeekView();
        } else {
            renderMonthView();
        }
    }

    function renderMonthView() {
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
        monthBody.className = 'grid grid-cols-7 auto-rows-fr h-full';

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

        // Next Month filler
        const totalCells = firstDay + daysInMonth;
        const remaining = 42 - totalCells;
        for (let i = 1; i <= remaining; i++) {
            monthBody.appendChild(createDayCell(i, true));
        }

        grid.appendChild(monthBody);

        if (window.lucide) window.lucide.createIcons();
    }

    function renderWeekView() {
        const grid = document.getElementById('calendarGrid');
        const title = document.getElementById('calendarTitle');
        if (!grid || !title) return;

        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Update Title
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        title.textContent = `Vecka ${getWeekNumber(weekStart)} - ${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

        // Clear Grid
        grid.innerHTML = '';

        // Render Day Headers with dates
        const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
        const headerRow = document.createElement('div');
        headerRow.className = 'grid grid-cols-7 border-b border-slate-200 bg-slate-50';

        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const isToday = dayDate.toDateString() === today.toDateString();

            const el = document.createElement('div');
            el.className = `py-4 text-center ${isToday ? 'bg-blue-50' : ''}`;
            el.innerHTML = `
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">${days[i]}</div>
                <div class="text-lg font-bold ${isToday ? 'text-blue-600' : 'text-slate-800'} mt-1">${dayDate.getDate()}</div>
            `;
            headerRow.appendChild(el);
        }
        grid.appendChild(headerRow);

        // Render Week Body
        const weekBody = document.createElement('div');
        weekBody.className = 'grid grid-cols-7 flex-1';

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);

            const dateStr = formatDateString(dayDate);
            const events = currentData.filter(inst => inst.date === dateStr);
            const isToday = dayDate.toDateString() === today.toDateString();

            const cell = document.createElement('div');
            cell.className = `min-h-[400px] p-2 border-r border-b border-slate-100 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`;
            cell.dataset.date = dateStr;

            // Enable drop zone
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('bg-blue-100');
            });

            cell.addEventListener('dragleave', (e) => {
                cell.classList.remove('bg-blue-100');
            });

            cell.addEventListener('drop', async (e) => {
                e.preventDefault();
                cell.classList.remove('bg-blue-100');
                const instId = e.dataTransfer.getData('text/plain');
                const newDate = cell.dataset.date;

                // Update installation date
                const inst = currentData.find(i => i.id === instId);
                if (inst && inst.date !== newDate) {
                    inst.date = newDate;
                    await window.WP.db.saveInstallation(inst);
                    render();
                }
            });

            // Render events
            events.forEach(ev => {
                const evEl = createEventElement(ev);
                cell.appendChild(evEl);
            });

            weekBody.appendChild(cell);
        }

        grid.appendChild(weekBody);

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

        // Drop zone setup
        if (!isOtherMonth && year && month !== undefined) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cell.dataset.date = dateStr;

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('bg-blue-100');
            });

            cell.addEventListener('dragleave', (e) => {
                cell.classList.remove('bg-blue-100');
            });

            cell.addEventListener('drop', async (e) => {
                e.preventDefault();
                cell.classList.remove('bg-blue-100');
                const instId = e.dataTransfer.getData('text/plain');
                const newDate = cell.dataset.date;

                const inst = currentData.find(i => i.id === instId);
                if (inst && inst.date !== newDate) {
                    inst.date = newDate;
                    await window.WP.db.saveInstallation(inst);
                    render();
                }
            });

            // Find events for this day
            // Find events for this day
            const events = currentData.filter(i => i.date === dateStr);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'mt-8 flex flex-col gap-1.5';

            const maxEvents = 2;
            if (events.length <= maxEvents) {
                events.forEach(ev => {
                    const evEl = createEventElement(ev, true);
                    eventsContainer.appendChild(evEl);
                });
            } else {
                const visibleEvents = events.slice(0, maxEvents - 1);
                visibleEvents.forEach(ev => {
                    const evEl = createEventElement(ev, true);
                    eventsContainer.appendChild(evEl);
                });

                const remaining = events.length - (maxEvents - 1);
                const moreEl = document.createElement('div');
                moreEl.className = 'text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded px-2 py-1 text-center w-full transition-colors cursor-pointer';
                moreEl.textContent = `+ ${remaining} till`;
                moreEl.title = 'Visa veckovy';
                moreEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Switch to week view focused on this date
                    currentDate = new Date(year, month, dayNum);
                    switchView('week');
                });
                eventsContainer.appendChild(moreEl);
            }
            cell.appendChild(eventsContainer);
        }

        return cell;
    }

    function createEventElement(ev, compact = false) {
        const evEl = document.createElement('div');
        const isCompleted = ev.status === 'completed';

        evEl.draggable = !isCompleted;
        evEl.dataset.id = ev.id;

        // Style based on status
        let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (ev.status === 'completed') colorClass = 'bg-green-100 text-green-800 border-green-300';
        if (ev.status === 'planned') colorClass = 'bg-blue-100 text-blue-800 border-blue-300';

        const cursorClass = isCompleted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing';
        evEl.className = `text-[10px] p-1.5 rounded border ${colorClass} ${cursorClass} truncate hover:opacity-80 transition-opacity mb-1`;

        const techName = ev.technician ? ev.technician.split(' ')[0] : '?';

        if (compact) {
            evEl.innerHTML = `
                <div class="font-semibold truncate">${ev.customer}</div>
                ${ev.technician ? `<div class="flex items-center gap-1 mt-0.5 opacity-75"><i data-lucide="user" class="w-3 h-3"></i> ${techName}</div>` : ''}
            `;
        } else {
            evEl.innerHTML = `
                <div class="font-semibold truncate">${ev.customer}</div>
                <div class="flex items-center gap-2 mt-1 opacity-75">
                    ${ev.technician ? `<span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${techName}</span>` : ''}
                    ${ev.estimatedTime ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${formatTime(ev.estimatedTime)}</span>` : ''}
                </div>
            `;
        }

        // Drag events
        evEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', ev.id);
            evEl.classList.add('opacity-50');
        });

        evEl.addEventListener('dragend', (e) => {
            evEl.classList.remove('opacity-50');
        });

        evEl.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Clicked event", ev);
        });

        return evEl;
    }

    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    window.WP = window.WP || {};
    window.WP.calendar = {
        init,
        render
    };
})();
