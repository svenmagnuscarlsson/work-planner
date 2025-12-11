(function () {
    const DB_NAME = 'work-planner-db';
    const ORG_STORE = 'installations';
    const TECH_STORE = 'technicians';

    async function initDB() {
        if (!window.idb) {
            console.error("IDB library not loaded");
            return;
        }
        return window.idb.openDB(DB_NAME, 2, { // Bump version
            upgrade(db) {
                if (!db.objectStoreNames.contains(ORG_STORE)) {
                    const store = db.createObjectStore(ORG_STORE, { keyPath: 'id' });
                    store.createIndex('status', 'status');
                    store.createIndex('technician', 'technician');
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

    async function seedDataIfEmpty() {
        const db = await initDB();
        const countValues = await Promise.all([
            db.count(ORG_STORE),
            db.count(TECH_STORE)
        ]);

        const countInst = countValues[0];
        const countTech = countValues[1];

        if (countTech === 0) {
            console.log("Seeding technicians...");
            const mockTechs = [
                { id: crypto.randomUUID(), name: "Martin Beermann", phone: "070-123 45 67", email: "martin@example.com" },
                { id: crypto.randomUUID(), name: "Anders Andersson", phone: "070-987 65 43", email: "anders@example.com" },
                { id: crypto.randomUUID(), name: "Eva Larsson", phone: "072-111 22 33", email: "eva@example.com" },
                { id: crypto.randomUUID(), name: "Lars Svensson", phone: "073-444 55 66", email: "lars@example.com" },
                { id: crypto.randomUUID(), name: "Magnus Carlsson", phone: "076-777 88 99", email: "magnus@example.com" }
            ];
            const tx = db.transaction(TECH_STORE, 'readwrite');
            await Promise.all([
                ...mockTechs.map(item => tx.store.put(item)),
                tx.done
            ]);
        }

        if (countInst === 0) {
            console.log("Seeding installations...");
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
        getInstallation,
        saveInstallation,
        getTechnicians,
        saveTechnician,
        deleteTechnician,
        seedDataIfEmpty
    };
})();
