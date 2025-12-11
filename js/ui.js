(function () {

    function getStatusColorClass(status) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'planned': return 'bg-blue-100 text-blue-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    }

    function getStatusLabel(status) {
        switch (status) {
            case 'completed': return 'Klar';
            case 'planned': return 'Planerad';
            default: return 'Väntande';
        }
    }

    function renderList(installations, containerId, onCardClick) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (installations.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Inga installationer hittades.</div>';
            return;
        }

        installations.forEach(inst => {
            const card = document.createElement('div');
            card.className = 'bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all';
            card.dataset.id = inst.id;

            const statusColor = getStatusColorClass(inst.status);
            const statusLabel = getStatusLabel(inst.status); // Use translation helper
            const canEdit = inst.status === 'pending' || inst.status === 'planned';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-slate-900 text-sm truncate pr-2 flex-1">${inst.customer}</h3>
                    <div class="flex items-center gap-2 shrink-0">
                         ${canEdit ? `<button class="edit-btn p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Redigera">
                            <i data-lucide="pencil" class="w-3 h-3"></i>
                        </button>` : ''}
                        <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${statusColor}">
                            ${statusLabel}
                        </span>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mb-2 truncate"><i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>${inst.address}</p>
                
                <div class="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                            <i data-lucide="user" class="w-3 h-3"></i>
                        </div>
                        <span class="text-xs text-slate-600 truncate max-w-[100px]">${inst.technician || 'Ej tilldelad'}</span>
                    </div>
                    ${inst.status === 'planned' ? '<button class="complete-btn text-[10px] text-green-600 hover:underline font-medium">Markera klar</button>' : ''}
                    ${inst.technician ? '' : '<button class="assign-btn text-[10px] text-blue-600 hover:underline font-medium">Tilldela</button>'}
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.assign-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignTechnician(inst, onCardClick);
                } else if (e.target.closest('.edit-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignTechnician(inst, onCardClick); // Reuse logic but will be updated to handle edit
                } else if (e.target.closest('.complete-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCompleteInstallation(inst, onCardClick);
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

    function updateStats(count) {
        const el = document.getElementById('installationCount');
        if (el) {
            el.textContent = `${count} installationer`;
        }
    }

    function closeAssignmentPanel() {
        const panel = document.getElementById('assignmentPanel');
        if (panel) {
            panel.classList.add('translate-x-full');
        }
    }

    async function handleAssignTechnician(inst, reloadCallback) {
        const panel = document.getElementById('assignmentPanel');
        const subtitleEl = document.getElementById('assignPanelSubtitle');
        const nameInput = document.getElementById('assignCustomerName');
        const dateInput = document.getElementById('assignDate');
        const titleEl = document.getElementById('assignPanelTitle');
        const techListContainer = document.querySelector('#assignmentPanel .space-y-3');

        // Clear existing radios
        if (techListContainer) techListContainer.innerHTML = '<p class="text-sm text-slate-500">Laddar tekniker...</p>';

        if (panel) {
            if (subtitleEl) subtitleEl.textContent = inst.address;
            if (titleEl) titleEl.textContent = "Redigera Installation";
            panel.dataset.currentId = inst.id;

            if (nameInput) nameInput.value = inst.customer || '';
            if (dateInput) dateInput.value = inst.date || '';

            // Load technicians dynamically
            if (techListContainer && window.WP.technicians) {
                const technicians = await window.WP.technicians.getAll();
                techListContainer.innerHTML = '';

                technicians.forEach(t => {
                    const label = document.createElement('label');
                    label.className = 'flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-1 has-[:checked]:ring-blue-500';

                    const isChecked = inst.technician === t.name ? 'checked' : '';

                    label.innerHTML = `
                        <input type="radio" name="technician" value="${t.name}"
                            class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" ${isChecked}>
                        <div class="ml-3">
                            <span class="block text-sm font-medium text-slate-900">${t.name}</span>
                            <span class="block text-xs text-slate-500">${t.phone}</span>
                        </div>
                    `;
                    techListContainer.appendChild(label);
                });
            }

            // Open panel
            panel.classList.remove('translate-x-full');
        }
    }

    async function handleCompleteInstallation(inst, reloadCallback) {
        if (confirm(`Är du säker på att du vill markera "${inst.customer}" som klar?`)) {
            inst.status = 'completed';
            await window.WP.db.saveInstallation(inst);

            // Reload UI
            if (reloadCallback) {
                const installations = await window.WP.db.getInstallations();
                reloadCallback(installations);
            }
        }
    }

    window.WP.ui = {
        renderList,
        updateStats,
        closeAssignmentPanel,
        handleCompleteInstallation
    };
})();
