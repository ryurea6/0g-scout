        // ===== CUSTOM SELECT DROPDOWN =====
        function toggleDropdown() {
            const options = document.getElementById('llmOptions');
            const trigger = document.getElementById('llmTrigger');
            const isOpen = options.classList.contains('open');
            options.classList.toggle('open');
            trigger.classList.toggle('active');
            if (!isOpen) {
                document.addEventListener('click', closeDropdownOutside, true);
            }
        }

        function closeDropdownOutside(e) {
            const wrapper = document.getElementById('llmProviderWrapper');
            if (!wrapper.contains(e.target)) {
                document.getElementById('llmOptions').classList.remove('open');
                document.getElementById('llmTrigger').classList.remove('active');
                document.removeEventListener('click', closeDropdownOutside, true);
            }
        }

        function selectOption(el) {
            document.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            const value = el.dataset.value;
            document.getElementById('llmProvider').value = value;
            // Update trigger display
            const trigger = document.getElementById('llmTrigger');
            trigger.querySelector('.custom-option-content').innerHTML = el.querySelector('.custom-option-content').innerHTML;
            // Close
            document.getElementById('llmOptions').classList.remove('open');
            trigger.classList.remove('active');
            document.removeEventListener('click', closeDropdownOutside, true);
            // Trigger provider change
            onProviderChange();
        }

