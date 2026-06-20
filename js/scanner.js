        // ===== LIVE PROJECT SCANNER =====
        const scannerProjects = [
            { name: '0G Protocol', chain: '0G', score: 9.2, status: 'live', trend: '+12%', trendDir: 'up' },
            { name: 'EigenLayer', chain: 'Ethereum', score: 8.8, status: 'live', trend: '+8%', trendDir: 'up' },
            { name: 'Monad', chain: 'Ethereum', score: 8.5, status: 'upcoming', trend: '+15%', trendDir: 'up' },
            { name: 'Berachain', chain: 'Ethereum', score: 8.3, status: 'live', trend: '+5%', trendDir: 'up' },
            { name: 'Scroll', chain: 'L2', score: 7.6, status: 'live', trend: '-2%', trendDir: 'down' },
            { name: 'zkSync Era', chain: 'L2', score: 7.8, status: 'live', trend: '+3%', trendDir: 'up' },
            { name: 'Linea', chain: 'L2', score: 7.9, status: 'live', trend: '+6%', trendDir: 'up' },
            { name: 'Starknet', chain: 'L2', score: 7.8, status: 'live', trend: '+4%', trendDir: 'up' },
            { name: 'Eclipse', chain: 'Solana', score: 7.4, status: 'upcoming', trend: '+22%', trendDir: 'up' },
            { name: 'Initia', chain: 'Ethereum', score: 7.1, status: 'upcoming', trend: '+9%', trendDir: 'up' },
            { name: 'LayerZero', chain: 'Ethereum', score: 8.1, status: 'live', trend: '+1%', trendDir: 'up' },
            { name: 'Wormhole', chain: 'Solana', score: 7.3, status: 'live', trend: '-1%', trendDir: 'down' },
            { name: 'Arbitrum', chain: 'L2', score: 6.8, status: 'ended', trend: '0%', trendDir: 'neutral' },
            { name: 'Optimism', chain: 'L2', score: 6.5, status: 'ended', trend: '-3%', trendDir: 'down' },
            { name: 'Celestia', chain: 'Ethereum', score: 7.7, status: 'live', trend: '+7%', trendDir: 'up' },
        ];

        function renderScanner(data) {
            const body = document.getElementById('scannerBody');
            if (!data) data = getFilteredScannerData();
            body.innerHTML = data.map((p, i) => {
                const scoreClass = p.score >= 8 ? 'score-high' : p.score >= 6 ? 'score-mid' : 'score-low';
                const pulseClass = p._pulse ? 'pulse-row' : '';
                return `<tr class="${pulseClass}">
                    <td><span class="scanner-project-name">${p.name}</span></td>
                    <td><span class="scanner-chain-tag">${p.chain}</span></td>
                    <td><span class="scanner-score ${scoreClass}">${p.score.toFixed(1)}</span></td>
                    <td><span class="scanner-status ${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                    <td><span class="scanner-trend ${p.trendDir}">${p.trendDir === 'up' ? '▲' : p.trendDir === 'down' ? '▼' : '—'} ${p.trend}</span></td>
                    <td><button class="scanner-analyze-btn" onclick="analyzeFromScanner('${p.name}')">Analyze</button></td>
                </tr>`;
            }).join('');
        }

        function getFilteredScannerData() {
            const chainF = document.getElementById('scannerChainFilter').value;
            const scoreF = document.getElementById('scannerScoreFilter').value;
            const statusF = document.getElementById('scannerStatusFilter').value;
            return scannerProjects.filter(p => {
                if (chainF !== 'all' && p.chain !== chainF) return false;
                if (scoreF === 'high' && p.score < 8) return false;
                if (scoreF === 'mid' && (p.score < 6 || p.score >= 8)) return false;
                if (scoreF === 'low' && p.score >= 6) return false;
                if (statusF !== 'all' && p.status !== statusF) return false;
                return true;
            });
        }

        function filterScanner() { renderScanner(); }

        function refreshScanner() {
            // Simulate data changes
            scannerProjects.forEach(p => {
                const delta = (Math.random() - 0.45) * 0.5;
                p.score = Math.max(1, Math.min(10, p.score + delta));
                p.score = Math.round(p.score * 10) / 10;
                const trendVal = Math.round((Math.random() - 0.4) * 20);
                p.trend = (trendVal >= 0 ? '+' : '') + trendVal + '%';
                p.trendDir = trendVal > 0 ? 'up' : trendVal < 0 ? 'down' : 'neutral';
                p._pulse = Math.random() > 0.6;
            });
            renderScanner();
            document.getElementById('scannerLastUpdate').innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Last updated: just now
            `;
            // Clear pulse after animation
            setTimeout(() => { scannerProjects.forEach(p => p._pulse = false); }, 2000);
        }

        function analyzeFromScanner(name) {
            document.getElementById('twitterInput').value = name;
            document.getElementById('ai-scoring').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => runAIScoring(), 500);
        }

        // Auto-refresh scanner every 30 seconds
        setInterval(refreshScanner, 30000);

