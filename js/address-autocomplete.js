(function () {
    const API_KEY = '5b3ce3597851110001cf6248d0175dd6b4564c3bb0d2eabdd87870e5';
    const API_URL = 'https://api.openrouteservice.org/geocode/autocomplete';

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    class AddressAutocomplete {
        constructor(inputId) {
            this.input = document.getElementById(inputId);
            if (!this.input) return;

            this.wrapper = null;
            this.list = null;
            this.setupUI();
            this.attachEvents();
        }

        setupUI() {
            // Create wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'relative w-full';
            this.input.parentNode.insertBefore(this.wrapper, this.input);
            this.wrapper.appendChild(this.input);

            // Create suggestions list (hidden by default)
            this.list = document.createElement('ul');
            this.list.className = 'absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden mt-1';
            this.wrapper.appendChild(this.list);
        }

        attachEvents() {
            this.input.addEventListener('input', debounce((e) => this.handleInput(e), 300));

            // Close list when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.wrapper.contains(e.target)) {
                    this.hideList();
                }
            });
        }

        async handleInput(e) {
            // Clear previous coordinates when user modifies text
            delete this.input.dataset.lat;
            delete this.input.dataset.lng;

            const query = e.target.value.trim();
            if (query.length < 3) {
                this.hideList();
                return;
            }

            try {
                const results = await this.fetchSuggestions(query);
                this.renderResults(results);
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        }

        async fetchSuggestions(query) {
            const url = `${API_URL}?api_key=${API_KEY}&text=${encodeURIComponent(query)}&boundary.country=SE`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data.features || [];
        }

        renderResults(features) {
            this.list.innerHTML = '';
            if (features.length === 0) {
                this.hideList();
                return;
            }

            features.forEach(feature => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-none';
                // Format the label
                const displayLabel = this.formatLabel(feature.properties.label);
                li.textContent = displayLabel;

                li.addEventListener('click', () => {
                    this.selectAddress(feature, displayLabel);
                });
                this.list.appendChild(li);
            });

            this.showList();
        }

        selectAddress(feature, formattedLabel) {
            // Use the formatted label for input value
            this.input.value = formattedLabel || this.formatLabel(feature.properties.label);

            // Store coordinates if available
            // OpenRouteService returns [lng, lat] in geometry.coordinates
            if (feature.geometry && feature.geometry.coordinates) {
                this.input.dataset.lng = feature.geometry.coordinates[0];
                this.input.dataset.lat = feature.geometry.coordinates[1];
            }

            this.hideList();

            // Dispatch a custom event if needed or trigger standard 'change' event
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        formatLabel(label) {
            if (!label) return '';
            // Remove ", Sweden" and optional region code (e.g. ", VG, Sweden")
            return label
                .replace(/, [A-Z]{2}, Sweden$/, '') // Remove ", VG, Sweden"
                .replace(/, Sweden$/, '');          // Remove ", Sweden"
        }


        showList() {
            this.list.classList.remove('hidden');
        }

        hideList() {
            this.list.classList.add('hidden');
        }
    }

    // Expose to global scope
    window.WP = window.WP || {};
    window.WP.setupAddressAutocomplete = (inputId) => {
        new AddressAutocomplete(inputId);
    };

})();
