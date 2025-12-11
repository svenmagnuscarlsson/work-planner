(function () {
    let isInitialized = false;

    function init(containerId) {
        if (isInitialized) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="p-6 border-b border-slate-200 bg-white">
                <h2 class="text-2xl font-bold text-slate-800">Statistik & Översikt</h2>
                <p class="text-sm text-slate-500 mt-1">Sammanställning av installationer och arbetsbelastning</p>
            </div>
            <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div id="statsContent" class="space-y-6">
                    <!-- Stats will be injected here -->
                </div>
            </div>
        `;

        isInitialized = true;
    }

    function render(installations) {
        const container = document.getElementById('statsContent');
        if (!container) return;

        // Calculate statistics
        const stats = calculateStats(installations);

        container.innerHTML = `
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${renderKPICard('Totalt', stats.total, 'list', 'bg-slate-100 text-slate-700')}
                ${renderKPICard('Väntande', stats.pending, 'clock', 'bg-amber-100 text-amber-700')}
                ${renderKPICard('Planerade', stats.planned, 'calendar', 'bg-blue-100 text-blue-700')}
                ${renderKPICard('Klara', stats.completed, 'check-circle', 'bg-green-100 text-green-700')}
            </div>

            <!-- Time Statistics -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="clock" class="w-5 h-5 text-slate-500"></i>
                        Tidsstatistik
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span class="text-sm text-slate-600">Total uppskattad tid</span>
                            <span class="font-bold text-slate-800">${formatTime(stats.totalEstimatedTime)}</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span class="text-sm text-slate-600">Genomsnittlig tid per jobb</span>
                            <span class="font-bold text-slate-800">${formatTime(stats.avgTime)}</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span class="text-sm text-slate-600">Planerade timmar</span>
                            <span class="font-bold text-blue-600">${formatTime(stats.plannedTime)}</span>
                        </div>
                    </div>
                </div>

                <!-- Category Distribution -->
                <div class="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="pie-chart" class="w-5 h-5 text-slate-500"></i>
                        Fördelning per kategori
                    </h3>
                    <div class="space-y-3">
                        ${renderCategoryDistribution(stats.categories, stats.total)}
                    </div>
                </div>
            </div>

            <!-- Technician Workload -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i data-lucide="users" class="w-5 h-5 text-slate-500"></i>
                    Arbetsbelastning per tekniker
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${renderTechnicianWorkload(stats.technicianStats)}
                </div>
            </div>

            <!-- Monthly Overview -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i data-lucide="bar-chart-3" class="w-5 h-5 text-slate-500"></i>
                    Månadsöversikt
                </h3>
                <div class="space-y-3">
                    ${renderMonthlyStats(stats.monthlyStats)}
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    function calculateStats(installations) {
        const stats = {
            total: installations.length,
            pending: 0,
            planned: 0,
            completed: 0,
            totalEstimatedTime: 0,
            avgTime: 0,
            plannedTime: 0,
            categories: {},
            technicianStats: {},
            monthlyStats: {}
        };

        installations.forEach(inst => {
            // Status counts
            if (inst.status === 'pending') stats.pending++;
            else if (inst.status === 'planned') stats.planned++;
            else if (inst.status === 'completed') stats.completed++;

            // Time stats
            const time = inst.estimatedTime || 0;
            stats.totalEstimatedTime += time;
            if (inst.status === 'planned') stats.plannedTime += time;

            // Category distribution
            const cat = inst.category || 'Övrigt';
            stats.categories[cat] = (stats.categories[cat] || 0) + 1;

            // Technician workload
            if (inst.technician) {
                if (!stats.technicianStats[inst.technician]) {
                    stats.technicianStats[inst.technician] = { total: 0, completed: 0, planned: 0, time: 0 };
                }
                stats.technicianStats[inst.technician].total++;
                stats.technicianStats[inst.technician].time += time;
                if (inst.status === 'completed') stats.technicianStats[inst.technician].completed++;
                if (inst.status === 'planned') stats.technicianStats[inst.technician].planned++;
            }

            // Monthly stats
            if (inst.date) {
                const month = inst.date.substring(0, 7); // YYYY-MM
                if (!stats.monthlyStats[month]) {
                    stats.monthlyStats[month] = { total: 0, completed: 0, planned: 0, pending: 0 };
                }
                stats.monthlyStats[month].total++;
                stats.monthlyStats[month][inst.status]++;
            }
        });

        // Calculate average
        if (stats.total > 0) {
            stats.avgTime = Math.round(stats.totalEstimatedTime / stats.total);
        }

        return stats;
    }

    function renderKPICard(title, value, icon, colorClass) {
        return `
            <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">${value}</p>
                    <p class="text-sm text-slate-500">${title}</p>
                </div>
            </div>
        `;
    }

    function renderCategoryDistribution(categories, total) {
        const categoryColors = {
            'Villalarm': 'bg-purple-500',
            'Företagslarm': 'bg-indigo-500',
            'Kameraövervakning': 'bg-cyan-500',
            'Service': 'bg-orange-500',
            'Övrigt': 'bg-slate-400'
        };

        return Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = categoryColors[cat] || 'bg-slate-400';
                return `
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-700">${cat}</span>
                            <span class="text-sm font-medium text-slate-800">${count} (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-2">
                            <div class="${color} h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function renderTechnicianWorkload(techStats) {
        if (Object.keys(techStats).length === 0) {
            return '<p class="text-slate-500 text-sm col-span-full">Inga tilldelade tekniker ännu.</p>';
        }

        return Object.entries(techStats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([name, data]) => {
                const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                return `
                    <div class="bg-slate-50 rounded-lg p-4">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                ${name.charAt(0)}
                            </div>
                            <div>
                                <p class="font-medium text-slate-800">${name}</p>
                                <p class="text-xs text-slate-500">${formatTime(data.time)} totalt</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="bg-white rounded p-2">
                                <p class="font-bold text-slate-800">${data.total}</p>
                                <p class="text-[10px] text-slate-500 uppercase">Totalt</p>
                            </div>
                            <div class="bg-white rounded p-2">
                                <p class="font-bold text-blue-600">${data.planned}</p>
                                <p class="text-[10px] text-slate-500 uppercase">Planerade</p>
                            </div>
                            <div class="bg-white rounded p-2">
                                <p class="font-bold text-green-600">${data.completed}</p>
                                <p class="text-[10px] text-slate-500 uppercase">Klara</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-slate-500">Slutförda</span>
                                <span class="font-medium text-slate-700">${completionRate}%</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-1.5">
                                <div class="bg-green-500 h-1.5 rounded-full" style="width: ${completionRate}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function renderMonthlyStats(monthlyStats) {
        const months = Object.keys(monthlyStats).sort().reverse().slice(0, 6);

        if (months.length === 0) {
            return '<p class="text-slate-500 text-sm">Ingen månadsdata tillgänglig ännu.</p>';
        }

        const monthNames = {
            '01': 'Januari', '02': 'Februari', '03': 'Mars', '04': 'April',
            '05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'Augusti',
            '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
        };

        return months.map(month => {
            const data = monthlyStats[month];
            const [year, mon] = month.split('-');
            const monthName = monthNames[mon] || mon;

            return `
                <div class="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div class="w-24 shrink-0">
                        <p class="font-medium text-slate-800">${monthName}</p>
                        <p class="text-xs text-slate-500">${year}</p>
                    </div>
                    <div class="flex-1 flex gap-6">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                            <span class="text-sm text-slate-600">Väntande: <strong>${data.pending || 0}</strong></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span class="text-sm text-slate-600">Planerade: <strong>${data.planned || 0}</strong></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                            <span class="text-sm text-slate-600">Klara: <strong>${data.completed || 0}</strong></span>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="font-bold text-slate-800">${data.total}</p>
                        <p class="text-xs text-slate-500">totalt</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatTime(minutes) {
        if (!minutes) return '0h';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
        if (hours > 0) return `${hours}h`;
        return `${mins}min`;
    }

    window.WP = window.WP || {};
    window.WP.statistics = {
        init,
        render
    };
})();
