(function () {
    const DB_NAME = 'work-planner-db';
    const ORG_STORE = 'installations';
    const TECH_STORE = 'technicians';

    // Installation categories
    const CATEGORIES = ['Villalarm', 'Företagslarm', 'Kameraövervakning', 'Service', 'Övrigt'];

    async function initDB() {
        if (!window.idb) {
            console.error("IDB library not loaded");
            return;
        }
        return window.idb.openDB(DB_NAME, 3, {
            upgrade(db, oldVersion) {
                if (!db.objectStoreNames.contains(ORG_STORE)) {
                    const store = db.createObjectStore(ORG_STORE, { keyPath: 'id' });
                    store.createIndex('status', 'status');
                    store.createIndex('technician', 'technician');
                    store.createIndex('category', 'category');
                }
                if (!db.objectStoreNames.contains(TECH_STORE)) {
                    db.createObjectStore(TECH_STORE, { keyPath: 'id' });
                }
            },
        });
    }

    async function getInstallations() {
        const db = await initDB();
        return db.getAll(ORG_STORE);
    }

    async function getInstallation(id) {
        const db = await initDB();
        return db.get(ORG_STORE, id);
    }

    async function saveInstallation(installation) {
        const db = await initDB();
        return db.put(ORG_STORE, installation);
    }

    async function deleteInstallation(id) {
        const db = await initDB();
        return db.delete(ORG_STORE, id);
    }

    // Technician Methods
    async function getTechnicians() {
        const db = await initDB();
        return db.getAll(TECH_STORE);
    }

    async function saveTechnician(tech) {
        const db = await initDB();
        return db.put(TECH_STORE, tech);
    }

    async function deleteTechnician(id) {
        const db = await initDB();
        return db.delete(TECH_STORE, id);
    }

    function getCategories() {
        return CATEGORIES;
    }

    // Expose to global namespace
    window.WP = window.WP || {};
    window.WP.db = {
        initDB,
        getInstallations,
        getInstallation,
        saveInstallation,
        deleteInstallation,
        getTechnicians,
        saveTechnician,
        deleteTechnician,
        getCategories
    };
})();
