        // ===== AI CHATBOT =====
        const CHATBOT_MODEL = 'deepseek-v4-flash';
        const CHATBOT_SYSTEM_PROMPT = `You are ØG Scout AI, an expert airdrop advisor built on 0G Network. Current date: June 2026. Help users discover crypto airdrops, analyze projects, and optimize their farming strategy. Be concise, helpful, and Web3-native.

ACTIVE PROJECTS (June 2026 — no token launched yet):
1. Abstract (Score: 8.5) — Consumer L2 by Pudgy Penguins/IGLOO. Chain: Ethereum. Status: Active. Mainnet live, no token.
2. Ritual (Score: 8.3) — Decentralized AI inference network. Chain: Ethereum. Status: Active.
3. Eclipse (Score: 8.0) — SVM L2 on Ethereum (Solana speed). Chain: Ethereum. Status: Active.
4. Farcaster (Score: 8.0) — Decentralized social protocol with Frames. Chain: Ethereum. Status: Active. No token announced.
5. Fhenix (Score: 7.3) — FHE privacy L2 with confidential smart contracts. Chain: Ethereum. Status: Testnet.
6. Ambient (Score: 7.0) — Gas-efficient AMM DEX. Chain: Ethereum. Status: Active.
7. Lens Protocol (Score: 7.0) — Decentralized social graph by Aave. Chain: Polygon. Status: Active.
8. DeBank (Score: 7.0) — Web3 portfolio tracker + Rabby wallet. Chain: Multi-chain. Status: Active.
9. Marginfi (Score: 6.8) — Solana lending with mPoints. Chain: Solana. Status: Active.
10. Beraborrow (Score: 6.5) — Native borrowing on Berachain. Chain: Berachain. Status: Active.

ENDED PROJECTS (token launched — do NOT recommend):
- 0G (0G), Pharos (PROS), Monad (MON), MegaETH (MEGA), Sahara AI (SAHARA), Linea (LINEA), Corn (CORN), Hyperliquid (HYPE), EigenLayer (EIGEN), Berachain (BERA), Scroll (SCR), Initia (INIT), Jupiter (JTO), Babylon (BABY), Kamino, Tensor, Drift, Parcl

Always mention current date (June 2026) and emphasize projects WITHOUT tokens yet. Never recommend ended projects.`;

        let chatbotHistory = [];
        let chatbotBusy = false;

        // Typing animation for welcome message
        function typeWelcomeMessage() {
            const el = document.getElementById('welcomeText');
            if (!el) return;

            const lines = [
                { html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:-4px;margin-right:8px"><circle cx="12" cy="12" r="10" stroke="#a78bfa" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#a78bfa"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle><path d="M12 6v6l4 2" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/></svg>', text: "Hey! I'm " },
                { html: '<strong style="color:#a78bfa">ØG Scout AI</strong>, your airdrop advisor', text: '' },
                { html: 'powered by <strong style="color:#a78bfa">0G Network</strong>.', text: '' },
                { html: '', text: '' },
                { html: 'Ask me about crypto airdrops, project analysis,', text: '' },
                { html: 'or farming strategies.', text: '' },
                { html: "I'm here to help you discover alpha! <svg width='16' height='16' viewBox='0 0 24 24' fill='none' style='display:inline-block;vertical-align:-2px;margin-left:4px'><path d='M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z' fill='#fbbf24'/></svg>", text: '' }
            ];

            el.innerHTML = '';
            let lineIdx = 0;
            let charIdx = 0;
            let cursor = null;

            function addCursor() {
                if (cursor) cursor.remove();
                cursor = document.createElement('span');
                cursor.className = 'typing-cursor';
                cursor.textContent = '|';
                el.appendChild(cursor);
            }

            function typeLine() {
                if (lineIdx >= lines.length) {
                    if (cursor) setTimeout(() => cursor.remove(), 1500);
                    return;
                }

                const line = lines[lineIdx];
                // First line: type text character by character with SVG prefix
                if (lineIdx === 0) {
                    if (charIdx === 0) {
                        const span = document.createElement('span');
                        span.id = 'welcome-line-0';
                        span.innerHTML = line.html;
                        el.appendChild(span);
                    }
                    const fullText = line.text;
                    if (charIdx < fullText.length) {
                        const span = document.getElementById('welcome-line-0');
                        span.innerHTML = line.html + fullText.substring(0, charIdx + 1);
                        charIdx++;
                        addCursor();
                        setTimeout(typeLine, 25 + Math.random() * 25);
                    } else {
                        lineIdx++;
                        charIdx = 0;
                        setTimeout(typeLine, 100);
                    }
                } else {
                    // Other lines: add as HTML with fade-in
                    if (line.html === '' && line.text === '') {
                        el.appendChild(document.createElement('br'));
                        lineIdx++;
                        setTimeout(typeLine, 50);
                        return;
                    }
                    const span = document.createElement('span');
                    span.innerHTML = line.html;
                    span.style.opacity = '0';
                    span.style.transition = 'opacity 0.3s';
                    el.appendChild(span);
                    addCursor();
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => { span.style.opacity = '1'; });
                    });
                    lineIdx++;
                    setTimeout(typeLine, 200);
                }
            }

            setTimeout(typeLine, 600);
        }

        // Initialize welcome typing on page load
        document.addEventListener('DOMContentLoaded', typeWelcomeMessage);

        async function sendChatbotMessage(msg) {
            const input = document.getElementById('chatbotInput');
            if (!msg) msg = input.value.trim();
            if (!msg || chatbotBusy) return;
            input.value = '';

            addChatbotMessage(msg, 'user');
            chatbotHistory.push({ role: 'user', content: msg });

            // Keep history manageable (last 20 messages = 10 exchanges)
            if (chatbotHistory.length > 20) chatbotHistory.splice(0, 2);

            chatbotBusy = true;
            document.getElementById('chatbotSendBtn').disabled = true;
            showChatbotTyping();

            try {
                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: CHATBOT_MODEL,
                        messages: [
                            { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
                            ...chatbotHistory
                        ],
                        temperature: 0.7,
                        max_tokens: 600
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error('API error ' + response.status + ': ' + errText.substring(0, 100));
                }

                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process that request.';

                chatbotHistory.push({ role: 'assistant', content: reply });
                hideChatbotTyping();
                addChatbotMessage(reply, 'ai');
            } catch (e) {
                console.error('Chatbot error:', e);
                hideChatbotTyping();
                addChatbotMessage('⚠️ Sorry, I encountered an error connecting to 0G Compute. Please try again in a moment.\n\n*Error: ' + e.message + '*', 'ai');
            } finally {
                chatbotBusy = false;
                document.getElementById('chatbotSendBtn').disabled = false;
                document.getElementById('chatbotInput').focus();
            }
        }

        function sendQuickPrompt(text) {
            document.getElementById('chatbotInput').value = text;
            sendChatbotMessage();
        }

        function addChatbotMessage(text, type) {
            const container = document.getElementById('chatbotMessages');
            const div = document.createElement('div');
            div.className = 'chatbot-msg chatbot-msg-' + type;
            // Simple markdown rendering
            let html = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            div.innerHTML = html;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        function showChatbotTyping() {
            const container = document.getElementById('chatbotMessages');
            const div = document.createElement('div');
            div.className = 'chatbot-typing';
            div.id = 'chatbotTyping';
            div.innerHTML = '<div class="chatbot-typing-dots"><span></span><span></span><span></span></div>';
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        function hideChatbotTyping() {
            const el = document.getElementById('chatbotTyping');
            if (el) el.remove();
        }

        // Legacy chat functions (kept for backward compat)
        const chatResponses = {
            "airdrop": "🔥 **Top Active Airdrops (June 2026):**\\n\\n1. **Abstract** (8.5) — Consumer L2 by Pudgy Penguins\\n2. **Ritual** (8.3) — AI inference network\\n3. **Eclipse** (8.0) — SVM L2 on Ethereum\\n4. **Farcaster** (8.0) — Decentralized social\\n5. **Fhenix** (7.3) — FHE privacy L2\\n\\nAll **no token yet** — farm now! 🎯",
            "0g": "**0G Protocol** — Token ALREADY LAUNCHED\\n\\n0G is now trading on exchanges.\\nIf you missed the airdrop, look at still-active projects like Abstract, Ritual, Eclipse.",
            "abstract": "**Abstract** — Consumer L2 by Pudgy Penguins\\n\\n• Mainnet live since early 2025\\n• Gaming & social focus\\n• Growing TVL and ecosystem\\n\\nStatus: **No token announced**\\nAirdrop potential: ⭐⭐⭐⭐ (8.5/10)",
            "farcaster": "**Farcaster** — Decentralized Social Protocol\\n\\n• Frames & mini-apps ecosystem\\n• Millions of users\\n• Strong developer activity\\n\\nStatus: **No token announced**\\nAirdrop potential: ⭐⭐⭐⭐ (8.0/10)",
        };
        const chatHistory = [];
        async function sendChat() { sendChatbotMessage(); }
        function addMessage(text, type) { addChatbotMessage(text, type === 'user' ? 'user' : 'ai'); }

        // Mouse glow effect
        document.addEventListener('mousemove', (e) => {
            const orbs = document.querySelectorAll('.orb');
            orbs[0].style.transform = `translate(${e.clientX * 0.02}px, ${e.clientY * 0.02}px)`;
            orbs[1].style.transform = `translate(${-e.clientX * 0.015}px, ${-e.clientY * 0.015}px)`;
        });

