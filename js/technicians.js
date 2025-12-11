(function () {
    let technicians = [];
    let isInitialized = false;

    function init(containerId) {
        if (isInitialized) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
                <h2 class="text-2xl font-bold text-slate-800">Tekniker</h2>
                <button id="addTechBtn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Ny Tekniker
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div id="techGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Techs here -->
                </div>
            </div>
        `;

        document.getElementById('addTechBtn').addEventListener('click', () => openModal());

        // Re-init generic modal for tech use or create specific?
        // Let's create a specific modal for simplicity or reuse "newInstallationModal" structure?
        // Better to inject a tech modal into body first time.
        createTechModal();

        isInitialized = true;
    }

    function createTechModal() {
        if (document.getElementById('techModal')) return;

        const modal = document.createElement('div');
        modal.id = 'techModal';
        modal.className = 'fixed inset-0 z-[2000] hidden';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" id="techModalBackdrop"></div>
            <div class="absolute inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                    <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-slate-900" id="techModalTitle">Ny Tekniker</h2>
                        <button class="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" id="closeTechModalBtn">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="techForm" class="p-6 space-y-4">
                        <input type="hidden" name="id">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Namn</label>
                            <input type="text" name="name" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input type="tel" name="phone" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                            <input type="email" name="email" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div class="pt-4 flex gap-3">
                            <button type="button" id="cancelTechModalBtn" class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Avbryt</button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg">Spara</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Listeners
        const close = () => {
            modal.classList.add('hidden');
            document.getElementById('techForm').reset();
            document.querySelector('#techForm input[name="id"]').value = '';
        };

        document.getElementById('closeTechModalBtn').addEventListener('click', close);
        document.getElementById('cancelTechModalBtn').addEventListener('click', close);
        document.getElementById('techModalBackdrop').addEventListener('click', close);

        document.getElementById('techForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                id: formData.get('id') || crypto.randomUUID(),
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            };

            await window.WP.db.saveTechnician(data);
            close();
            render(); // Refresh list
        });
    }

    function openModal(tech = null) {
        const modal = document.getElementById('techModal');
        const title = document.getElementById('techModalTitle');
        const form = document.getElementById('techForm');

        if (tech) {
            title.textContent = "Redigera Tekniker";
            form.querySelector('[name="id"]').value = tech.id;
            form.querySelector('[name="name"]').value = tech.name;
            form.querySelector('[name="phone"]').value = tech.phone;
            form.querySelector('[name="email"]').value = tech.email;
        } else {
            title.textContent = "Ny Tekniker";
            form.reset();
            form.querySelector('[name="id"]').value = '';
        }

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }

    async function render() {
        const grid = document.getElementById('techGrid');
        if (!grid) return;

        technicians = await window.WP.db.getTechnicians();

        grid.innerHTML = '';

        technicians.forEach(t => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group';
            card.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <span class="font-bold text-lg">${t.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">${t.name}</h3>
                        <p class="text-xs text-slate-500">Tekniker</p>
                    </div>
                </div>
                <div class="space-y-1 text-sm text-slate-600">
                    <div class="flex items-center gap-2">
                        <i data-lucide="phone" class="w-4 h-4 text-slate-400"></i>
                        ${t.phone}
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="mail" class="w-4 h-4 text-slate-400"></i>
                        ${t.email}
                    </div>
                </div>
                <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="edit-tech p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-tech p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;

            card.querySelector('.edit-tech').addEventListener('click', () => openModal(t));
            card.querySelector('.delete-tech').addEventListener('click', async () => {
                window.WP.ui.showConfirmModal(
                    'Bekräfta borttagning',
                    `Är du säker på att du vill ta bort ${t.name}?`,
                    async () => {
                        await window.WP.db.deleteTechnician(t.id);
                        render();
                    }
                );
            });

            grid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    window.WP = window.WP || {};
    window.WP.technicians = {
        init,
        render,
        getAll: async () => await window.WP.db.getTechnicians()
    };
})();
