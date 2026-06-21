// ===== CONFIG =====
        const PROXY_URL = 'https://developments-volunteers-directed-amino.trycloudflare.com';

        // ===== PARTICLES =====
        const canvas = document.getElementById('particles');
        const ctx = canvas.getContext('2d');
        let particles = [];
        function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.3 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
                ctx.fill();
            }
        }
        for (let i = 0; i < 50; i++) particles.push(new Particle());

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${0.05 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();

        // Scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Animate stats
                    const statNums = entry.target.querySelectorAll('.stat-number[data-target]');
                    statNums.forEach(el => {
                        const target = parseInt(el.dataset.target);
                        const suffix = el.dataset.suffix || '';
                        animateCount(el, target, 2000, suffix);
                    });
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

        function animateCount(el, target, duration, suffix) {
            const start = performance.now();
            function update(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(target * eased) + suffix;
                if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }

        // Nav scroll effect
        window.addEventListener('scroll', () => {
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
        });

        // Nav mobile
        function toggleNav() {
            const links = document.querySelector('.nav-links');
            links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
            links.style.position = 'absolute';
            links.style.top = '100%';
            links.style.left = '0';
            links.style.right = '0';
            links.style.flexDirection = 'column';
            links.style.background = 'rgba(5,0,20,0.95)';
            links.style.padding = '20px';
            links.style.gap = '16px';
            links.style.borderBottom = '1px solid var(--border)';
        }


        // Demo data (fallback if API is unavailable) — Updated June 2026
        const demoProjects = [
            { name: "Abstract", desc: "Consumer L2 by Pudgy Penguins/IGLOO — gaming & social", tags: ["L2", "Consumer", "Gaming"], score: 8.5, chain: "Ethereum", status: "active" },
            { name: "Ritual", desc: "Decentralized AI inference network — on-chain AI execution", tags: ["AI", "Inference", "Infrastructure"], score: 8.3, chain: "Ethereum", status: "active" },
            { name: "Eclipse", desc: "SVM L2 on Ethereum — Solana speed + Ethereum settlement", tags: ["L2", "SVM", "Solana"], score: 8.0, chain: "Ethereum", status: "active" },
            { name: "Farcaster", desc: "Decentralized social protocol — Frames, Channels, ecosystem", tags: ["Social", "Protocol", "Web3"], score: 8.0, chain: "Ethereum", status: "active" },
            { name: "Fhenix", desc: "FHE L2 — confidential smart contracts with fully homomorphic encryption", tags: ["L2", "FHE", "Privacy"], score: 7.3, chain: "Ethereum", status: "testnet" },
            { name: "Ambient", desc: "Gas-efficient AMM DEX with concentrated liquidity", tags: ["DEX", "AMM", "DeFi"], score: 7.0, chain: "Ethereum", status: "active" },
            { name: "Lens Protocol", desc: "Decentralized social graph by Aave — portable identity", tags: ["Social", "Identity", "Aave"], score: 7.0, chain: "Polygon", status: "active" },
            { name: "DeBank", desc: "Web3 portfolio tracker & DeFi dashboard — Rabby wallet", tags: ["Portfolio", "Analytics", "Wallet"], score: 7.0, chain: "Multi-chain", status: "active" },
            { name: "Marginfi", desc: "Solana lending protocol with mPoints rewards", tags: ["Lending", "DeFi", "Solana"], score: 6.8, chain: "Solana", status: "active" },
            { name: "Beraborrow", desc: "Native borrowing protocol on Berachain", tags: ["Lending", "DeFi", "Berachain"], score: 6.5, chain: "Berachain", status: "active" },
        ];

        async function scanProject() {
            const input = document.getElementById("searchInput").value.trim();
            if (!input) return;
            document.getElementById("loading").style.display = "block";
            document.getElementById("results").style.display = "none";
            document.getElementById("scanBtn").disabled = true;

            try {
                const filtered = demoProjects.filter(p =>
                    p.name.toLowerCase().includes(input.toLowerCase()) ||
                    p.desc.toLowerCase().includes(input.toLowerCase())
                );
                renderProjects(filtered.length > 0 ? filtered : demoProjects);
            } finally {
                document.getElementById("loading").style.display = "none";
                document.getElementById("scanBtn").disabled = false;
            }
        }

        function renderProjects(projects) {
            const list = document.getElementById("projectList");
            list.innerHTML = projects.map((p, i) => {
                const scoreClass = p.score >= 8 ? "score-high" : p.score >= 6 ? "score-mid" : "score-low";
                const statusClass = p.status === "active" ? "status-active" : p.status === "testnet" ? "status-testnet" : "status-ended";
                const statusText = p.status === "active" ? "🟢 Active" : p.status === "testnet" ? "🟡 Testnet" : "🔴 Ended";
                return `<div class="project-card" style="animation-delay:${i*0.1}s">
                    <div class="project-rank">#${i+1}</div>
                    <div class="project-info"><h3>${p.name}</h3><p>${p.desc}</p><span class="status-badge ${statusClass}">${statusText}</span></div>
                    <div class="project-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
                    <div class="score"><div class="score-value ${scoreClass}">${p.score}</div><div class="score-label">Score</div></div>
                </div>`;
            }).join("");
            document.getElementById("resultsCount").textContent = `${projects.length} projects`;
            document.getElementById("results").style.display = "block";
        }

