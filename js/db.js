(function () {
    const DB_NAME = 'work-planner-db';
    const ORG_STORE = 'installations';

    async function initDB() {
        if (!window.idb) {
            console.error("IDB library not loaded");
            return;
        }
        return window.idb.openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(ORG_STORE)) {
                    const store = db.createObjectStore(ORG_STORE, { keyPath: 'id' });
                    store.createIndex('status', 'status');
                    store.createIndex('technician', 'technician');
                }
            },
        });
    }

    async function getInstallations() {
        const db = await initDB();
        return db.getAll(ORG_STORE);
    }

    async function saveInstallation(installation) {
        const db = await initDB();
        return db.put(ORG_STORE, installation);
    }

    async function seedDataIfEmpty() {
        const db = await initDB();
        const count = await db.count(ORG_STORE);

        if (count === 0) {
            console.log("Seeding database...");
            const mockData = [
                {
                    id: crypto.randomUUID(),
                    customer: "Svensson Villa",
                    address: "Storgatan 12, Stockholm",
                    lat: 59.3293,
                    lng: 18.0686,
                    status: "pending",
                    technician: null,
                    date: "2024-05-20"
                },
                {
                    id: crypto.randomUUID(),
                    customer: "Företaget AB",
                    address: "Sveavägen 44, Stockholm",
                    lat: 59.3360,
                    lng: 18.0600,
                    status: "planned",
                    technician: "Anders Andersson",
                    date: "2024-05-21"
                },
                {
                    id: crypto.randomUUID(),
                    customer: "Kiosk City",
                    address: "Hornsgatan 10, Stockholm",
                    lat: 59.3190,
                    lng: 18.0700,
                    status: "completed",
                    technician: "Eva Larsson",
                    date: "2024-05-18"
                },
                {
                    id: crypto.randomUUID(),
                    customer: "Lagercentralen",
                    address: "Årstaängsvägen 21, Stockholm",
                    lat: 59.2900,
                    lng: 18.0300,
                    status: "pending",
                    technician: null,
                    date: "2024-05-22"
                },
                {
                    id: crypto.randomUUID(),
                    customer: "Privatperson",
                    address: "Karlavägen 50, Stockholm",
                    lat: 59.3400,
                    lng: 18.0800,
                    status: "pending",
                    technician: null,
                    date: "2024-05-23"
                }
            ];

            const tx = db.transaction(ORG_STORE, 'readwrite');
            await Promise.all([
                ...mockData.map(item => tx.store.put(item)),
                tx.done
            ]);
            console.log("Seeding complete.");
        }
    }

    // Expose to global namespace
    window.WP = window.WP || {};
    window.WP.db = {
        initDB,
        getInstallations,
        saveInstallation,
        seedDataIfEmpty
    };
})();
