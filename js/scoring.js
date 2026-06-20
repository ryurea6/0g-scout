        // ===== AI SCORING WITH LLM =====
        const HF_MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";


        function onProviderChange() {
            const provider = document.getElementById('llmProvider').value;
            document.getElementById('apiKeyRow').style.display = provider === '0g-custom' ? 'flex' : 'none';
            if (provider === '0g-custom') {
                document.querySelector('#apiKeyRow label').textContent = 'Your 0G API Key';
                document.getElementById('ogApiKey').placeholder = 'sk-... (get free at pc.0g.ai)';
            }
        }

        function showTyping(text) {
            const el = document.getElementById('typingIndicator');
            document.getElementById('typingText').textContent = text || 'Contacting LLM...';
            el.style.display = 'flex';
            document.getElementById('aiResultCard').style.display = 'none';
        }
        function hideTyping() {
            document.getElementById('typingIndicator').style.display = 'none';
        }

        function getBadge(score) {
            if (score >= 80) return 'AI Pioneer';
            if (score >= 60) return 'Web3 Builder';
            if (score >= 40) return 'Crypto Explorer';
            return 'Builder';
        }

        function showResult(score, reasoning, providerName, isFallback) {
            hideTyping();
            const card = document.getElementById('aiResultCard');
            const s = Math.max(0, Math.min(100, Math.round(score)));
            document.getElementById('aiResultScore').textContent = s;
            document.getElementById('aiResultBadge').textContent = getBadge(s);
            document.getElementById('aiResultProvider').textContent = 'via ' + providerName;
            document.getElementById('aiResultReasoning').textContent = reasoning;
            // Animate bar
            setTimeout(() => { document.getElementById('aiResultBarFill').style.width = s + '%'; }, 100);
            // Fallback note
            const note = document.getElementById('aiFallbackNote');
            if (isFallback) {
                note.textContent = '⚠️ LLM unavailable — fell back to rule-based scoring.';
                note.style.display = 'block';
            } else {
                note.style.display = 'none';
            }
            card.style.display = 'block';
        }

        // Rule-based scoring (enhanced)
        function ruleBasedScore(text) {
            const lower = text.toLowerCase();
            let score = 20;
            const aiTerms = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'neural', 'deep learning', 'gpt', 'transformer'];
            const web3Terms = ['web3', 'blockchain', 'defi', 'nft', 'dao', 'crypto', 'token', 'wallet', 'ethereum', 'eth', 'solana', 'sol'];
            const buildTerms = ['builder', 'developer', 'dev', 'founder', 'building', 'protocol', 'open source', 'contributor'];
            const ogTerms = ['0g', '0g labs', 'zero gravity', 'og labs'];
            const engagementTerms = ['followers', 'community', 'engagement', 'gm', 'wagmi', 'ser', 'anon'];

            aiTerms.forEach(t => { if (lower.includes(t)) score += 10; });
            web3Terms.forEach(t => { if (lower.includes(t)) score += 8; });
            buildTerms.forEach(t => { if (lower.includes(t)) score += 7; });
            ogTerms.forEach(t => { if (lower.includes(t)) score += 15; });
            engagementTerms.forEach(t => { if (lower.includes(t)) score += 4; });
            // Length bonus for detailed bios
            if (text.length > 100) score += 5;
            if (text.length > 200) score += 5;

            score = Math.min(100, Math.max(10, score));
            const matched = [];
            [...aiTerms, ...web3Terms, ...buildTerms, ...ogTerms].forEach(t => { if (lower.includes(t)) matched.push(t); });
            const reasoning = matched.length > 0
                ? `Detected keywords: ${[...new Set(matched)].join(', ')}. Score based on term relevance and bio depth.`
                : 'Limited matching keywords found. Score reflects baseline engagement potential.';
            return { score, reasoning };
        }

        // Hugging Face free Inference API
        async function scoreWithHuggingFace(text) {
            const prompt = `<s>[INST] You are a Web3 engagement analyst. Analyze the following Twitter profile/bio and rate the user's Web3 engagement and airdrop potential on a scale of 0-100. Respond ONLY with a JSON object: {"score": <number>, "reasoning": "<brief explanation>"}

Profile/Bio: "${text}" [/INST]</s>`;

            const response = await fetch(HF_MODEL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { max_new_tokens: 300, temperature: 0.3, return_full_text: false }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error('HF API error: ' + response.status + ' - ' + errText);
            }

            const data = await response.json();
            let generated = '';
            if (Array.isArray(data) && data[0]?.generated_text) {
                generated = data[0].generated_text;
            } else if (data.generated_text) {
                generated = data.generated_text;
            } else {
                throw new Error('Unexpected HF response format');
            }

            // Parse JSON from response
            const jsonMatch = generated.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { score: parsed.score, reasoning: parsed.reasoning, provider: 'Hugging Face' };
            }
            // Fallback: extract number
            const numMatch = generated.match(/(\d{1,3})/);
            if (numMatch) {
                return { score: parseInt(numMatch[1]), reasoning: generated.substring(0, 200), provider: 'Hugging Face' };
            }
            throw new Error('Could not parse LLM response');
        }

        // 0G Router (OpenAI-compatible)
        async function scoreWithOGRouter(text) {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-v4-flash',
                    messages: [
                        { role: 'system', content: 'You are a Web3 engagement analyst. Analyze Twitter profiles/bios and rate Web3 engagement & airdrop potential. Respond ONLY with JSON: {"score": <0-100>, "reasoning": "<brief explanation>"}' },
                        { role: 'user', content: `Analyze this Twitter profile/bio and score it 0-100 for Web3 engagement & airdrop potential:\n\n"${text}"` }
                    ],
                    temperature: 0.3,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error('0G Router error: ' + response.status + ' - ' + errText);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const jsonMatch = content.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { score: parsed.score, reasoning: parsed.reasoning, provider: '0G Router' };
            }
            const numMatch = content.match(/(\d{1,3})/);
            if (numMatch) {
                return { score: parseInt(numMatch[1]), reasoning: content.substring(0, 200), provider: '0G Router' };
            }
            throw new Error('Could not parse 0G Router response');
        }

        async function runAIScoring() {
            const input = document.getElementById('twitterInput').value.trim();
            if (!input) { document.getElementById('twitterInput').focus(); return; }

            const provider = document.getElementById('llmProvider').value;
            const btn = document.getElementById('aiScoreBtn');
            btn.disabled = true;

            if (provider === 'rule-based') {
                showTyping('Running rule-based analysis...');
                await new Promise(r => setTimeout(r, 800));
                const result = ruleBasedScore(input);
                showResult(result.score, result.reasoning, 'Rule-based', false);
                btn.disabled = false;
                return;
            }

            if (provider === '0g-custom') {
                const apiKey = document.getElementById('ogApiKey').value.trim();
                if (!apiKey) {
                    hideTyping();
                    alert('Get your free API key at pc.0g.ai → Generate Key');
                    btn.disabled = false;
                    return;
                }
                showTyping('Contacting 0G Compute (your key)...');
                try {
                    const result = await scoreWithOGRouter(input);
                    showResult(result.score, result.reasoning, '0G Compute', false);
                } catch (e) {
                    console.warn('0G Router failed, falling back to rule-based:', e);
                    const fb = ruleBasedScore(input);
                    showResult(fb.score, fb.reasoning + '\n\n[0G error: ' + e.message + ']', 'Rule-based (fallback)', true);
                }
                btn.disabled = false;
                return;
            }

            if (provider === 'huggingface') {
                showTyping('Contacting Hugging Face (Mistral 7B)...');
                try {
                    const result = await scoreWithHuggingFace(input);
                    showResult(result.score, result.reasoning, 'Hugging Face', false);
                } catch (e) {
                    console.warn('Hugging Face failed, falling back to rule-based:', e);
                    const fb = ruleBasedScore(input);
                    showResult(fb.score, fb.reasoning + '\n\n[HF error: ' + e.message + ']', 'Rule-based (fallback)', true);
                }
                btn.disabled = false;
                return;
            }

            // Default: 0G Compute with built-in key
            showTyping('Analyzing with ØG Compute...');
            try {
                const result = await scoreWithOGRouter(input);
                showResult(result.score, result.reasoning, 'ØG Compute', false);
            } catch (e) {
                console.warn('0G Compute failed, falling back to rule-based:', e);
                const fb = ruleBasedScore(input);
                showResult(fb.score, fb.reasoning + '\n\n[ØG error: ' + e.message + ']', 'Rule-based (fallback)', true);
            }
            btn.disabled = false;
        }

