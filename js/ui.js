(function () {

    function getStatusColorClass(status) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200 border';
            case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200 border';
            default: return 'bg-amber-100 text-amber-800 border-amber-200 border';
        }
    }

    function getStatusLabel(status) {
        switch (status) {
            case 'completed': return 'Klar';
            case 'planned': return 'Planerad';
            default: return 'Väntande';
        }
    }

    function getCategoryColorClass(category) {
        switch (category) {
            case 'Villalarm': return 'bg-purple-100 text-purple-700';
            case 'Företagslarm': return 'bg-indigo-100 text-indigo-700';
            case 'Kameraövervakning': return 'bg-cyan-100 text-cyan-700';
            case 'Service': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    function formatTime(minutes) {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
        if (hours > 0) return `${hours}h`;
        return `${mins}min`;
    }

    function renderSkeleton(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.innerHTML += `
                <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-3">
                    <div class="h-4 bg-slate-200 rounded w-3/4 mb-2 skeleton"></div>
                    <div class="h-3 bg-slate-200 rounded w-1/2 mb-3 skeleton"></div>
                    <div class="flex gap-2">
                        <div class="h-5 w-16 bg-slate-200 rounded skeleton"></div>
                        <div class="h-5 w-12 bg-slate-200 rounded skeleton"></div>
                    </div>
                </div>`;
        }
    }

    function renderList(installations, containerId, onCardClick, onDeleteCallback) {
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
            const statusLabel = getStatusLabel(inst.status);
            const categoryColor = getCategoryColorClass(inst.category);
            const canEdit = inst.status === 'pending' || inst.status === 'planned';
            const canDelete = inst.status !== 'completed';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-slate-900 text-sm truncate pr-2 flex-1">${inst.customer}</h3>
                    <div class="flex items-center gap-2 shrink-0">
                         ${canEdit ? `<button class="edit-btn p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Redigera">
                            <i data-lucide="pencil" class="w-3 h-3"></i>
                        </button>` : ''}
                        ${canDelete ? `<button class="delete-btn p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Ta bort">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>` : ''}
                        <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${statusColor}">
                            ${statusLabel}
                        </span>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mb-2 truncate"><i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>${inst.address}</p>
                
                <div class="flex items-center gap-2 mb-2">
                    ${inst.category ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColor}">${inst.category}</span>` : ''}
                    ${inst.estimatedTime ? `<span class="text-[10px] text-slate-500 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${formatTime(inst.estimatedTime)}</span>` : ''}
                </div>
                
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
                    handleAssignTechnician(inst, onCardClick);
                } else if (e.target.closest('.delete-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteInstallation(inst, onDeleteCallback);
                } else if (e.target.closest('.complete-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCompleteInstallation(inst, onDeleteCallback);
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

    function showConfirmModal(title, message, onConfirm, options = {}) {
        const modal = document.getElementById('confirmationModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const actionBtn = document.getElementById('confirmActionBtn');
        const backdrop = document.getElementById('confirmBackdrop');
        const iconContainer = document.getElementById('confirmIconContainer');
        const icon = document.getElementById('confirmIcon');

        if (!modal) return;

        // Default options
        const config = {
            confirmText: 'Ta bort',
            confirmColor: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
            icon: 'alert-triangle',
            iconColor: 'bg-red-100 text-red-600',
            ...options
        };

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Apply Styles
        actionBtn.textContent = config.confirmText;
        actionBtn.className = `px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-lg ${config.confirmColor}`;

        iconContainer.className = `w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${config.iconColor}`;
        icon.setAttribute('data-lucide', config.icon);

        if (window.lucide) window.lucide.createIcons();

        function close() {
            modal.classList.add('hidden');
            // Clean up listeners to prevent memory leaks/double actions
            actionBtn.onclick = null;
            cancelBtn.onclick = null;
            backdrop.onclick = null;

            // Re-enable button if it was disabled
            actionBtn.disabled = false;
        }

        // Logic
        cancelBtn.onclick = close;
        backdrop.onclick = close;

        actionBtn.onclick = async () => {
            // Reset state in case it was disabled previously
            actionBtn.disabled = false;

            const originalText = actionBtn.textContent;
            actionBtn.disabled = true;
            actionBtn.textContent = 'Bearbetar...';

            try {
                await onConfirm();
            } catch (e) {
                console.error("Error in confirm action:", e);
                // Restore button state on error
                actionBtn.textContent = originalText;
                actionBtn.disabled = false;
                return;
            }

            close();
        };

        modal.classList.remove('hidden');
    }

    async function handleAssignTechnician(inst, reloadCallback) {
        const panel = document.getElementById('assignmentPanel');
        const subtitleEl = document.getElementById('assignPanelSubtitle');
        const nameInput = document.getElementById('assignCustomerName');
        const dateInput = document.getElementById('assignDate');
        const titleEl = document.getElementById('assignPanelTitle');
        const categorySelect = document.getElementById('assignCategory');
        const timeInput = document.getElementById('assignEstimatedTime');
        const techListContainer = document.getElementById('technicianRadioList');

        // Clear existing radios
        if (techListContainer) techListContainer.innerHTML = '<p class="text-sm text-slate-500">Laddar tekniker...</p>';

        if (panel) {
            if (subtitleEl) subtitleEl.textContent = inst.address;
            if (titleEl) titleEl.textContent = "Redigera Installation";
            panel.dataset.currentId = inst.id;

            if (nameInput) nameInput.value = inst.customer || '';
            if (dateInput) dateInput.value = inst.date || '';
            if (categorySelect) categorySelect.value = inst.category || 'Villalarm';
            if (timeInput) timeInput.value = (inst.estimatedTime / 60) || 2; // Convert minutes to hours for display

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

    async function handleDeleteInstallation(inst, reloadCallback) {
        showConfirmModal(
            'Bekräfta borttagning',
            `Är du säker på att du vill ta bort "${inst.customer}"?`,
            async () => {
                await window.WP.db.deleteInstallation(inst.id);
                if (reloadCallback) reloadCallback();
            },
            {
                confirmText: 'Ta bort',
                confirmColor: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
                icon: 'alert-triangle',
                iconColor: 'bg-red-100 text-red-600'
            }
        );
    }

    async function handleCompleteInstallation(inst, reloadCallback) {
        showConfirmModal(
            'Markera som klar',
            `Är du säker på att du vill markera "${inst.customer}" som klar?`,
            async () => {
                // Find card and animate
                const card = document.querySelector(`div[data-id="${inst.id}"]`);
                if (card) {
                    card.classList.add('animate-success-pulse', 'border-green-400', 'bg-green-50');
                }

                await new Promise(r => setTimeout(r, 600)); // Wait for animation

                inst.status = 'completed';
                await window.WP.db.saveInstallation(inst);
                if (reloadCallback) {
                    const installations = await window.WP.db.getInstallations();
                    reloadCallback(installations);
                }
            },
            {
                confirmText: 'Markera klar',
                confirmColor: 'bg-green-600 hover:bg-green-700 shadow-green-600/20',
                icon: 'check-circle',
                iconColor: 'bg-green-100 text-green-600'
            }
        );
    }

    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;

        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';

        toast.innerHTML = `
            <div class="text-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}-500 shrink-0">
                <i data-lucide="${iconName}" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-slate-800">${message}</p>
            </div>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Remove after duration
        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, duration);
    }

    window.WP.ui = {
        renderList,
        renderSkeleton,
        updateStats,
        closeAssignmentPanel,
        handleCompleteInstallation,
        handleDeleteInstallation,
        formatTime,
        getCategoryColorClass,
        showConfirmModal,
        showToast
    };
})();
