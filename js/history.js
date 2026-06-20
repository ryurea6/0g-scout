        // ===== LEADERBOARD =====

        // ===== 0G STORAGE / SCAN HISTORY =====
        const STORAGE_KEY = 'og_scout_scan_history';

        function getScanHistory() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            } catch { return []; }
        }

        function saveScanHistory(entry) {
            const history = getScanHistory();
            history.unshift(entry);
            if (history.length > 50) history.pop();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            renderScanHistory();
        }

        function renderScanHistory() {
            const history = getScanHistory();
            const list = document.getElementById('scanHistoryList');
            document.getElementById('scanHistoryCount').textContent = history.length;
            if (history.length === 0) {
                list.innerHTML = '<div class="scan-history-empty">No saved scans yet. Analyze a profile and save to 0G Storage!</div>';
                return;
            }
            list.innerHTML = history.map((entry, i) => {
                const scoreClass = entry.score >= 80 ? 'score-high' : entry.score >= 60 ? 'score-mid' : 'score-low';
                const timeStr = new Date(entry.timestamp).toLocaleString();
                return `<div class="scan-history-item" style="animation-delay:${i * 0.05}s">
                    <div class="scan-history-score ${scoreClass}">${entry.score}</div>
                    <div class="scan-history-info">
                        <h4>${entry.name}</h4>
                        <p>${entry.reasoning ? entry.reasoning.substring(0, 80) + '...' : 'AI Scored'}</p>
                        <div class="scan-history-tx">0G TX: ${entry.txHash}</div>
                    </div>
                    <span class="scan-history-badge">${entry.badge}</span>
                    <span class="scan-history-time">${timeStr}</span>
                </div>`;
            }).join('');
        }

        function saveToStorage() {
            const btn = document.getElementById('saveStorageBtn');
            const score = document.getElementById('aiResultScore').textContent;
            const badge = document.getElementById('aiResultBadge').textContent;
            const reasoning = document.getElementById('aiResultReasoning').textContent;
            const input = document.getElementById('twitterInput').value.trim();

            // Simulate 0G Storage transaction
            btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></div> Saving to 0G Storage...';
            btn.disabled = true;

            setTimeout(() => {
                const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                const entry = {
                    name: input,
                    score: parseInt(score),
                    badge: badge,
                    reasoning: reasoning,
                    timestamp: new Date().toISOString(),
                    txHash: txHash,
                };
                saveScanHistory(entry);

                btn.innerHTML = '✓ Saved to 0G Storage';
                btn.classList.add('saved');

                // Add notification
                addNotification({
                    type: 'tvl',
                    icon: '💾',
                    title: 'Saved to 0G Storage',
                    text: `<strong>${input}</strong> score (${score}) saved on-chain`
                });
            }, 1500);
        }

        // Update showResult to show save button
        const _origShowResult = showResult;
        showResult = function(score, reasoning, providerName, isFallback) {
            _origShowResult(score, reasoning, providerName, isFallback);
            const saveBtn = document.getElementById('saveStorageBtn');
            saveBtn.style.display = 'inline-flex';
            saveBtn.classList.remove('saved');
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Save to 0G Storage`;
        };
        renderScanHistory();
        const _origRenderDashboard = renderDashboard;
        async function renderDashboardWrapper(address, chainId) {
            await _origRenderDashboard(address, chainId);
        }
        // Re-assign for auto-reconnect
        window._renderDashboardForReconnect = renderDashboardWrapper;

        // --- Auto-Reconnect on Page Load ---
        (function autoReconnect() {
            try {
                const stored = localStorage.getItem(WALLET_STORAGE_KEY);
                if (!stored) return;
                const raw = JSON.parse(stored);
                // Support both old format {connected,address,chainId} and new obfuscated {k,c}
                let state;
                if (raw.k) {
                    const addr = atob(raw.k.split('').reverse().join(''));
                    state = { connected: true, address: addr, chainId: raw.c };
                } else if (raw.connected && raw.address) {
                    state = raw;
                } else {
                    clearWalletState();
                    return;
                }
                if (state.connected && state.address) {
                    if (window.ethereum) {
                        window.ethereum.request({ method: 'eth_accounts' })
                            .then(accounts => {
                                if (accounts.length > 0 && accounts[0].toLowerCase() === state.address.toLowerCase()) {
                                    walletState = state;
                                    updateNavForConnected(state.address);
                                    renderDashboard(state.address, state.chainId);
                                    setupWalletListeners();
                                    startNotifications();
                                } else {
                                    clearWalletState();
                                }
                            })
                            .catch(() => clearWalletState());
                    } else {
                        clearWalletState();
                    }
                }
            } catch (e) {
                clearWalletState();
            }
        })();

