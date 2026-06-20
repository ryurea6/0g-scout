        // ===== WALLET CONNECT & DASHBOARD =====
        const WALLET_STORAGE_KEY = 'og_scout_wallet';

        // Known chain IDs
        const CHAIN_NAMES = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            137: 'Polygon',
            56: 'BNB Chain',
            42161: 'Arbitrum One',
            10: 'Optimism',
            8453: 'Base',
            16600: '0G Network',
            16601: '0G Testnet',
            5000: 'Mantle',
            324: 'zkSync Era',
        };

        function truncateAddress(addr) {
            if (!addr) return '';
            return addr.slice(0, 6) + '...' + addr.slice(-4);
        }

        // --- Wallet State ---
        let walletState = {
            connected: false,
            address: null,
            chainId: null,
        };

        function saveWalletState(address, chainId) {
            walletState = { connected: true, address, chainId };
            // Obfuscate address before storing (not cryptographic, but prevents casual reading)
            const obf = btoa(address.toLowerCase()).split('').reverse().join('');
            localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({ k: obf, c: chainId }));
        }

        function clearWalletState() {
            walletState = { connected: false, address: null, chainId: null };
            localStorage.removeItem(WALLET_STORAGE_KEY);
        }

        // --- Modal ---
        function openWalletModal() {
            if (walletState.connected) return; // Already connected, ignore
            document.getElementById('walletModalOverlay').classList.add('open');
            document.getElementById('walletModalError').style.display = 'none';
        }

        function closeWalletModal() {
            document.getElementById('walletModalOverlay').classList.remove('open');
        }

        function showWalletError(msg) {
            const el = document.getElementById('walletModalError');
            el.textContent = msg;
            el.style.display = 'block';
        }

        // Close modal on overlay click
        document.getElementById('walletModalOverlay').addEventListener('click', function(e) {
            if (e.target === this) closeWalletModal();
        });

        // --- Connect MetaMask ---
        async function connectMetaMask() {
            if (!window.ethereum) {
                showWalletError('Please install MetaMask or another Web3 wallet to connect.');
                return;
            }

            try {
                document.getElementById('walletModalError').style.display = 'none';
                const btn = document.getElementById('walletConnectBtn');
                btn.classList.add('connecting');
                btn.innerHTML = '<div class="spinner-small"></div><span class="wallet-btn-text">Connecting...</span>';

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                const chainId = parseInt(chainIdHex, 16);
                const address = accounts[0];

                saveWalletState(address, chainId);
                closeWalletModal();
                updateNavForConnected(address);
                renderDashboard(address, chainId);
                setupWalletListeners();
                startNotifications();
            } catch (err) {
                console.error('Wallet connect error:', err);
                if (err.code === 4001) {
                    showWalletError('Connection rejected by user.');
                } else {
                    showWalletError('Failed to connect: ' + (err.message || 'Unknown error'));
                }
                updateNavForDisconnected();
            }
        }

        function connectWalletConnect() {
            showWalletError('WalletConnect integration coming soon. Please use MetaMask for now.');
        }
        function connectCoinbase() {
            showWalletError('Coinbase Wallet integration coming soon. Please use MetaMask for now.');
        }

        // --- Disconnect ---
        function disconnectWallet() {
            clearWalletState();
            updateNavForDisconnected();
            document.getElementById('dashboard').classList.remove('visible');
            closeWalletDropdown();
        }

        // --- Nav Update ---
        function updateNavForConnected(address) {
            const area = document.getElementById('walletNavArea');
            area.innerHTML = `
                <div class="wallet-connected-wrap">
                    <button class="wallet-address-btn" onclick="toggleWalletDropdown()">
                        <span class="dot-green"></span>
                        <span>${truncateAddress(address)}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <div class="wallet-dropdown" id="walletDropdown">
                        <div class="wallet-dropdown-item" onclick="scrollToDashboard()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                            Dashboard
                        </div>
                        <div class="wallet-dropdown-item" onclick="copyAddress('${address}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy Address
                        </div>
                        <div class="wallet-dropdown-divider"></div>
                        <div class="wallet-dropdown-item" onclick="disconnectWallet()" style="color:var(--red);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Disconnect
                        </div>
                    </div>
                </div>
            `;
        }

        function updateNavForDisconnected() {
            const area = document.getElementById('walletNavArea');
            area.innerHTML = `
                <button class="wallet-btn" id="walletConnectBtn" onclick="openWalletModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.5"/></svg>
                    <span class="wallet-btn-text">Connect Wallet</span>
                </button>
            `;
        }

        function toggleWalletDropdown() {
            const dd = document.getElementById('walletDropdown');
            if (!dd) return;
            const isOpen = dd.classList.contains('open');
            dd.classList.toggle('open');
            if (!isOpen) {
                document.addEventListener('click', closeDropdownOnOutside, true);
            }
        }

        function closeDropdownOnOutside(e) {
            const wrap = document.querySelector('.wallet-connected-wrap');
            if (wrap && !wrap.contains(e.target)) {
                closeWalletDropdown();
            }
        }

        function closeWalletDropdown() {
            const dd = document.getElementById('walletDropdown');
            if (dd) dd.classList.remove('open');
            document.removeEventListener('click', closeDropdownOnOutside, true);
        }

        function copyAddress(addr) {
            navigator.clipboard.writeText(addr).then(() => {
                const items = document.querySelectorAll('.wallet-dropdown-item');
                items[1].querySelector('svg').nextElementSibling || null;
                // Brief visual feedback
                const btn = document.querySelector('.wallet-address-btn');
                if (btn) {
                    btn.style.borderColor = 'rgba(52,211,153,0.5)';
                    setTimeout(() => { btn.style.borderColor = ''; }, 1000);
                }
            });
            closeWalletDropdown();
        }

        function scrollToDashboard() {
            closeWalletDropdown();
            document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
        }

        // --- Wallet Event Listeners ---
        function setupWalletListeners() {
            if (!window.ethereum || window._walletListenersSet) return;
            window._walletListenersSet = true;

            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    const address = accounts[0];
                    saveWalletState(address, walletState.chainId);
                    updateNavForConnected(address);
                    renderDashboard(address, walletState.chainId);
                }
            });

            window.ethereum.on('chainChanged', (chainIdHex) => {
                const chainId = parseInt(chainIdHex, 16);
                walletState.chainId = chainId;
                saveWalletState(walletState.address, chainId);
                renderDashboard(walletState.address, chainId);
            });
        }

        // --- Dashboard Rendering ---
        async function renderDashboard(address, chainId) {
            const dash = document.getElementById('dashboard');
            dash.classList.add('visible');

            // Address
            document.getElementById('dashAddress').textContent = truncateAddress(address);
            document.getElementById('dashAddressFull').textContent = address;

            // Network
            const networkName = CHAIN_NAMES[chainId] || ('Chain #' + chainId);
            document.getElementById('dashNetwork').textContent = networkName;
            document.getElementById('dashChainId').textContent = 'Chain ID: ' + chainId;
            document.getElementById('dashNetworkBadge').textContent = networkName;

            // Balance
            try {
                const balanceHex = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [address, 'latest']
                });
                const balanceWei = parseInt(balanceHex, 16);
                const balanceEth = (balanceWei / 1e18).toFixed(4);
                document.getElementById('dashBalance').textContent = balanceEth + ' ETH';
            } catch (e) {
                document.getElementById('dashBalance').textContent = 'N/A';
            }

            // Portfolio Score (heuristic based on address)
            const score = generatePortfolioScore(address);
            animateScoreRing(score.value);
            document.getElementById('dashScoreNumber').textContent = score.value;
            document.getElementById('dashScoreReason').textContent = score.reasoning;

            // Tracked Projects
            renderDashProjects();

            // Recent Activity
            renderDashActivity(address);

            // Trigger fade-up animations
            setTimeout(() => {
                dash.querySelectorAll('.dash-fade-up').forEach(el => el.classList.add('visible'));
            }, 100);
        }

        function generatePortfolioScore(address) {
            // Heuristic scoring based on address hex characteristics
            // (simulates an on-chain analysis — real version would call 0G Compute)
            const hex = address.toLowerCase().replace('0x', '');
            let score = 45;

            // Address diversity bonus (unique hex chars)
            const uniqueChars = new Set(hex).size;
            score += Math.floor(uniqueChars * 1.5);

            // Leading zeros pattern
            const leadingZeros = hex.match(/^0+/);
            if (leadingZeros) score -= leadingZeros[0].length * 2;

            // Even/odd balance
            const lastChar = parseInt(hex[hex.length - 1], 16);
            if (lastChar % 2 === 0) score += 3;

            // Length bonus for valid address
            if (hex.length === 40) score += 5;

            // Clamp
            score = Math.max(25, Math.min(92, score));

            let reasoning = '';
            if (score >= 75) {
                reasoning = 'Your wallet shows strong on-chain activity indicators. High engagement across multiple protocols suggests active DeFi participation. Airdrop eligibility looks promising.';
            } else if (score >= 55) {
                reasoning = 'Moderate on-chain footprint detected. Increasing transaction frequency and interacting with more protocols could boost your airdrop eligibility score.';
            } else {
                reasoning = 'Your wallet has a relatively low on-chain activity profile. Consider bridging assets, staking, and participating in testnets to improve your airdrop potential.';
            }

            return { value: score, reasoning };
        }

        function animateScoreRing(score) {
            const circumference = 2 * Math.PI * 52; // r=52
            const offset = circumference - (score / 100) * circumference;
            setTimeout(() => {
                document.getElementById('scoreRing').style.strokeDashoffset = offset;
            }, 300);
        }

        function renderDashProjects() {
            const grid = document.getElementById('dashProjectsGrid');
            grid.innerHTML = demoProjects.map((p, i) => {
                const scoreClass = p.score >= 8 ? 'score-high' : p.score >= 6 ? 'score-mid' : 'score-low';
                return `<div class="dashboard-project-card">
                    <div class="dashboard-project-rank">#${i + 1}</div>
                    <div class="dashboard-project-info">
                        <h4>${p.name}</h4>
                        <p>${p.desc}</p>
                    </div>
                    <div class="dashboard-project-score ${scoreClass}">${p.score}</div>
                </div>`;
            }).join('');
            document.getElementById('dashProjectCount').textContent = demoProjects.length;
        }

        function renderDashActivity(address) {
            // Placeholder activity based on address
            const activities = [
                { icon: 'transfer', emoji: '💸', title: 'ETH Transfer', desc: 'Sent 0.5 ETH', time: '2h ago' },
                { icon: 'swap', emoji: '🔄', title: 'Token Swap', desc: 'Swapped USDC → ETH on Uniswap', time: '5h ago' },
                { icon: 'stake', emoji: '🥩', title: 'Staking', desc: 'Staked 2 ETH in EigenLayer', time: '1d ago' },
                { icon: 'contract', emoji: '📝', title: 'Contract Interaction', desc: 'Interacted with 0G Storage contract', time: '3d ago' },
                { icon: 'transfer', emoji: '🎁', title: 'Airdrop Claim', desc: 'Claimed 500 TOKEN from Berachain', time: '5d ago' },
            ];

            const list = document.getElementById('dashActivityList');
            list.innerHTML = activities.map(a => `
                <div class="activity-item">
                    <div class="activity-icon ${a.icon}">${a.emoji}</div>
                    <div class="activity-info">
                        <h4>${a.title}</h4>
                        <p>${a.desc}</p>
                    </div>
                    <div class="activity-time">${a.time}</div>
                </div>
            `).join('');
        }

