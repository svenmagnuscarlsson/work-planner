# Work Planner - Inbrottslarmsinstallationer

En statisk webbapplikation för att planera och hantera installationer av inbrottslarm.

## Funktioner

### 📋 Installationshantering
- **Lista** över alla installationer med status och tilldelad tekniker
- **Lägg till** nya installationer via formulär
- **Redigera** befintliga installationer (kundnamn, tekniker, datum)
- **Markera som klar** när en installation är slutförd

### 🗺️ Kartvy
- Interaktiv karta med markörer för varje installation
- Klicka på en markör för att se detaljer
- Färgkodning baserat på status

### 📅 Kalender
- Månadsvy över planerade och genomförda installationer
- Navigera mellan månader
- Se vilken tekniker som är tilldelad varje jobb

### 👷 Teknikerhantering
- **Lägg till** nya tekniker med namn, telefon och e-post
- **Redigera** befintliga tekniker
- **Ta bort** tekniker
- Dynamisk lista vid tilldelning av installationer

## Statusflöde

```
VÄNTANDE → PLANERAD → KLAR
```

1. **Väntande** - Ny installation utan tilldelad tekniker
2. **Planerad** - Tekniker och datum tilldelat
3. **Klar** - Installation slutförd (kan ej redigeras)

## Komma igång

1. Öppna `index.html` i en webbläsare
2. Appen laddar automatiskt exempeldata vid första användning
3. All data sparas lokalt i webbläsarens IndexedDB

## Teknisk stack

- **HTML5** + **Vanilla JavaScript**
- **Tailwind CSS** (via CDN)
- **Leaflet** för kartor
- **Lucide Icons** för ikoner
- **IndexedDB** för lokal datalagring

## Filstruktur

```
work-planner/
├── index.html          # Huvudsida
├── js/
│   ├── app.js          # Applikationslogik
│   ├── db.js           # Databashantering
│   ├── map.js          # Kartfunktioner
│   ├── ui.js           # UI-komponenter
│   ├── calendar.js     # Kalenderfunktioner
│   └── technicians.js  # Teknikerhantering
└── README.md
```

## Användning

### Lägga till installation
1. Klicka på **"+ Ny installation"** i vänstermenyn
2. Fyll i kundnamn och adress
3. Klicka **"Spara"**

### Tilldela tekniker
1. Klicka på **"Tilldela"** på ett installationskort
2. Välj tekniker och datum
3. Klicka **"Spara"**

### Markera som klar
1. Hitta en **planerad** installation
2. Klicka på **"Markera klar"**
3. Bekräfta i dialogrutan

### Hantera tekniker
1. Klicka på **"Tekniker"** i menyn
2. Använd **"+ Ny Tekniker"** för att lägga till
3. Hover över ett kort för att redigera eller ta bort

---

*Utvecklad med ❤️ för effektiv planering av inbrottslarmsinstallationer*
