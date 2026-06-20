        // ===== NOTIFICATION SYSTEM =====
        let notifications = [];
        let notifOpen = false;

        const mockNotifications = [
            { type: 'project', icon: '🚀', title: 'New project detected', text: '<strong>Monad</strong> scored <strong>8.5</strong> — Parallel EVM L1 gaining traction' },
            { type: 'whale', icon: '🐋', title: 'Whale movement', text: 'Whale moved <strong>500 ETH</strong> to <strong>EigenLayer</strong> restaking pool' },
            { type: 'tvl', icon: '📈', title: 'TVL Update', text: 'Your tracked project <strong>0G Protocol</strong> TVL +15% in 24h' },
            { type: 'project', icon: '🔥', title: 'Hot project', text: '<strong>Berachain</strong> scored <strong>8.3</strong> — Proof of Liquidity gaining momentum' },
            { type: 'whale', icon: '🐋', title: 'Whale alert', text: 'Whale deposited <strong>1,200 ETH</strong> into <strong>zkSync Era</strong> bridge' },
            { type: 'tvl', icon: '📊', title: 'Score update', text: '<strong>Scroll</strong> score increased from <strong>7.2</strong> to <strong>7.6</strong>' },
            { type: 'project', icon: '⭐', title: 'New listing', text: '<strong>Starknet</strong> scored <strong>7.8</strong> — ZK-rollup with growing ecosystem' },
            { type: 'whale', icon: '🐋', title: 'Whale movement', text: '3 whales accumulated <strong>2.5M USDC</strong> on <strong>Linea</strong>' },
            { type: 'tvl', icon: '🎯', title: 'Airdrop signal', text: '<strong>Eclipse</strong> hints at token — TVL surged 200% this week' },
            { type: 'project', icon: '🔮', title: 'Trending', text: '<strong>Initia</strong> scored <strong>7.1</strong> — Interwoven rollup narrative heating up' },
        ];
        let notifIndex = 0;

        function addNotification(notif) {
            const id = Date.now() + Math.random();
            notifications.unshift({ ...notif, id, read: false, time: new Date() });
            if (notifications.length > 20) notifications.pop();
            renderNotifications();
            updateNotifBadge();
        }

        function renderNotifications() {
            const list = document.getElementById('notifList');
            if (notifications.length === 0) {
                list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
                return;
            }
            list.innerHTML = notifications.map((n, i) => {
                const timeAgo = getTimeAgo(n.time);
                return `<div class="notif-item ${n.read ? 'read' : 'unread'}" onclick="markNotifRead(${i})" style="animation-delay:${i * 0.05}s">
                    <div class="notif-icon ${n.type}">${n.icon}</div>
                    <div class="notif-content">
                        <p>${n.text}</p>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                </div>`;
            }).join('');
        }

        function getTimeAgo(date) {
            const secs = Math.floor((new Date() - date) / 1000);
            if (secs < 60) return 'just now';
            if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
            if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
            return Math.floor(secs / 86400) + 'd ago';
        }

        function updateNotifBadge() {
            const badge = document.getElementById('notifBadge');
            const unread = notifications.filter(n => !n.read).length;
            badge.textContent = unread;
            badge.classList.toggle('hidden', unread === 0);
        }

        function toggleNotifDropdown() {
            const dd = document.getElementById('notifDropdown');
            notifOpen = !notifOpen;
            dd.classList.toggle('open', notifOpen);
            if (notifOpen) {
                document.addEventListener('click', closeNotifOutside, true);
            }
        }

        function closeNotifOutside(e) {
            const wrap = document.getElementById('notifWrap');
            if (wrap && !wrap.contains(e.target)) {
                document.getElementById('notifDropdown').classList.remove('open');
                notifOpen = false;
                document.removeEventListener('click', closeNotifOutside, true);
            }
        }

        function markNotifRead(index) {
            notifications[index].read = true;
            renderNotifications();
            updateNotifBadge();
        }

        function clearAllNotifications() {
            notifications = [];
            renderNotifications();
            updateNotifBadge();
        }

        // Only show notifications when wallet is connected
        function startNotifications() {
            if (!walletState || !walletState.connected) return;
            addNotification(mockNotifications[0]);
            notifIndex = 1;
            setInterval(() => {
                if (!walletState || !walletState.connected) return;
                const notif = mockNotifications[notifIndex % mockNotifications.length];
                addNotification(notif);
                notifIndex++;
            }, 10000);
        }

