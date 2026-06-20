        // ===== SCROLL PROGRESS BAR =====
        (function() {
            const progressBar = document.getElementById('scrollProgress');
            window.addEventListener('scroll', function() {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                progressBar.style.width = progress + '%';
            }, { passive: true });
        })();

        // ===== BACK TO TOP BUTTON =====
        (function() {
            const btn = document.getElementById('backToTop');
            window.addEventListener('scroll', function() {
                btn.classList.toggle('visible', window.scrollY > 500);
            }, { passive: true });
        })();

        // ===== NAV ACTIVE STATE (SCROLL SPY) =====
        (function() {
            const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
            const sections = [];
            navLinks.forEach(link => {
                const id = link.getAttribute('href');
                if (id && id !== '#') {
                    const section = document.querySelector(id);
                    if (section) sections.push({ el: section, link: link });
                }
            });
            function updateActiveNav() {
                const scrollY = window.scrollY + 120;
                let current = null;
                for (let i = sections.length - 1; i >= 0; i--) {
                    if (scrollY >= sections[i].el.offsetTop) {
                        current = sections[i].link;
                        break;
                    }
                }
                navLinks.forEach(l => l.classList.remove('active'));
                if (current) current.classList.add('active');
            }
            window.addEventListener('scroll', updateActiveNav, { passive: true });
            updateActiveNav();
        })();

        // ===== ENHANCED INTERSECTION OBSERVER (staggered child animations) =====
        (function() {
            const staggerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const children = entry.target.querySelectorAll('.feature-card, .stat-item, .dashboard-project-card, .activity-item');
                        children.forEach((child, i) => {
                            child.style.opacity = '0';
                            child.style.transform = 'translateY(20px)';
                            child.style.transition = `all 0.5s ease ${i * 0.08}s`;
                            requestAnimationFrame(() => {
                                child.style.opacity = '1';
                                child.style.transform = 'translateY(0)';
                            });
                        });
                        staggerObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.features-grid, .stats-grid, .dashboard-projects-grid, .activity-list').forEach(el => {
                staggerObserver.observe(el);
            });
        })();

        // ===== SKELETON LOADING =====
        (function() {
            function scannerSkeleton() {
                const body = document.getElementById('scannerBody');
                let html = '';
                for (let i = 0; i < 8; i++) {
                    html += '<tr class="skeleton-row"><td><div class="skeleton" style="width:100px;height:14px"></div></td><td><div class="skeleton" style="width:50px;height:14px;border-radius:6px"></div></td><td><div class="skeleton" style="width:30px;height:14px"></div></td><td><div class="skeleton" style="width:50px;height:20px;border-radius:100px"></div></td><td><div class="skeleton" style="width:40px;height:14px"></div></td><td><div class="skeleton" style="width:60px;height:28px;border-radius:8px"></div></td></tr>';
                }
                body.innerHTML = html;
            }

            // Show skeletons immediately
            scannerSkeleton();

            // Replace with real content after simulated load
            const delay = 800 + Math.random() * 700;
            setTimeout(() => {
                renderScanner();
            }, delay);
        })();