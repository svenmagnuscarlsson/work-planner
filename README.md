# MacaPlanner - Arbetsplanerare

En modern och responsiv webbapplikation för att planera, hantera och följa upp installationer av inbrottslarm och säkerhetssystem.

## Funktioner

### 📋 Installationshantering
- **Översikt** över alla installationer med tydlig statusindikering
- **Sökfunktion** för att snabbt hitta installationer, kunder eller tekniker
- **Lägg till** nya installationer med automatisk geokodning av adresser
- **Filtrering** på status (Väntande, Planerad, Klar)

### 🗺️ Interaktiv Karta
- Dynamisk karta baserad på **Leaflet**
- **Kategorispecifika ikoner** (Villalarm, Företagslarm, Kameraövervakning m.m.)
- Visuell feedback med animationer vid navigering
- Klicka på markörer för snabbinfo och navigering

### 📅 Kalender & Planering
- **Månads- & Veckovy** för flexibel översikt
- **Drag-and-drop** funktion för enkel ombokning av planerade jobb
- **Smart vy**: Begränsad visning (max 2) per dag i månadsvyn för renare layout
- Expanderbar dagsvy via "+ X till"-knapp som tar dig direkt till veckovyn
- Tydlig visning av tilldelade tekniker

### 📊 Statistik & Analys
- **Dashboard** med nyckeltal (KPI:er)
- Tidsstatistik och kategorifördelning
- Belastningsanalys per tekniker
- Månadsöversikt för historisk data

### 👷 Teknikerhantering
- Databas över tillgängliga tekniker
- Enkel tilldelning via gränssnittet

### ♿ Tillgänglighet & UX
- Helt responsiv design anpassad för desktop, surfplatta och mobil
- **Aria-anpassad** för skärmläsare
- Tydlig visuell feedback (Toasts, Skeletons, laddningsindikatorer)

## Statusflöde

```
VÄNTANDE → PLANERAD → KLAR
```

1. **Väntande** - Ny installation registrerad, inväntar planering.
2. **Planerad** - Tekniker och datum har tilldelats.
3. **Klar** - Arbetet slutfört och godkänt.

## Komma igång

1. Öppna `index.html` i en modern webbläsare.
2. Applikationen laddar automatiskt exempeldata vid första start.
3. Ingen backend krävs - all data sparas lokalt i webbläsaren (**IndexedDB**).

## Teknisk Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Karta**: Leaflet.js & OpenStreetMap
- **Ikoner**: Lucide Icons
- **Lagring**: IndexedDB (via idb biblioteket)

## Filstruktur

```
work-planner/
├── index.html          # Applikationens ingångspunkt
├── js/
│   ├── app.js          # Huvudsaklig logik och initiering
│   ├── db.js           # Databaslager (IndexedDB wrapper)
│   ├── map.js          # Kartlogik och rendering
│   ├── ui.js           # Delade UI-komponenter och helpers
│   ├── calendar.js     # Kalendervy
│   ├── technicians.js  # Teknikerhantering
│   └── statistics.js   # Statistik och dashboard
└── README.md           # Dokumentation
```

## Användning

### Skapa ny installation
1. Klicka på **"Ny Installation"** i övre hörnet.
2. Fyll i kunduppgifter och adress.
3. Adressen geokodas automatiskt för att placeras på kartan.

### Planera arbete
1. Klicka **"Tilldela"** på ett kort eller välj **"Redigera"**.
2. Välj tekniker och datum i panelen som öppnas.
3. Spara för att uppdatera status till **Planerad**.

### Avsluta jobb
1. När arbetet är klart, klicka **"Markera klar"** på kortet.
2. Installationen låses och markeras grön i systemet.

---

*Utvecklad för maximal effektivitet och användarvänlighet.*
