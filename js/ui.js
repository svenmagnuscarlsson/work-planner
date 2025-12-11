(function () {

    function renderList(installations, containerId, onCardClick) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (installations.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">No installations found.</div>';
            return;
        }

        installations.forEach(inst => {
            const card = document.createElement('div');
            card.className = 'bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all';
            card.dataset.id = inst.id;

            const statusColor = getStatusColorClass(inst.status);
            const statusLabel = inst.status.charAt(0).toUpperCase() + inst.status.slice(1);

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-slate-900 text-sm truncate pr-2">${inst.customer}</h3>
                    <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${statusColor}">
                        ${statusLabel}
                    </span>
                </div>
                <p class="text-xs text-slate-500 mb-2 truncate"><i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>${inst.address}</p>
                
                <div class="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                            <i data-lucide="user" class="w-3 h-3"></i>
                        </div>
                        <span class="text-xs text-slate-600 truncate max-w-[100px]">${inst.technician || 'Unassigned'}</span>
                    </div>
                    ${inst.technician ? '' : '<button class="assign-btn text-[10px] text-blue-600 hover:underline font-medium">Assign</button>'}
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.assign-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignTechnician(inst, onCardClick);
                } else {
                    onCardClick(inst);
                }
            });

            container.appendChild(card);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async function handleAssignTechnician(inst, reloadCallback) {
        const techName = prompt(`Assign a technician for ${inst.customer}:`, "Martin Beermann");
        if (techName) {
            inst.technician = techName;
            inst.status = 'planned';

            if (window.WP && window.WP.db) {
                await window.WP.db.saveInstallation(inst);
                alert(`Assigned ${techName} to ${inst.customer}`);
                window.location.reload();
            } else {
                console.error("DB module not found");
            }
        }
    }

    function updateStats(count) {
        const el = document.getElementById('installationCount');
        if (el) el.textContent = `${count} total`;
    }

    function getStatusColorClass(status) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'planned': return 'bg-blue-100 text-blue-700';
            default: return 'bg-red-100 text-red-700';
        }
    }

    window.WP = window.WP || {};
    window.WP.ui = {
        renderList,
        updateStats
    };
})();
