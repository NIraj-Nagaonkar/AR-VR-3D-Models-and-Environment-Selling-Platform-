document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const promptInput = document.getElementById('promptInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatContainer = document.getElementById('chatContainer');
  const welcomeBox = document.getElementById('welcomeBox');
  const messagesList = document.getElementById('messagesList');
  const newChatBtn = document.getElementById('newChatBtn');
  const recentList = document.getElementById('recentList');
  const welcomeGreetingSubject = document.getElementById('welcomeGreetingSubject');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');
  const cardsGrid = document.getElementById('cardsGrid');
  const inputDisclaimer = document.getElementById('inputDisclaimer');
  
  // Dual Engine Controls
  const engineGeminiBtn = document.getElementById('engineGeminiBtn');
  const engineLumaBtn = document.getElementById('engineLumaBtn');
  const modeSwitchBtn = document.getElementById('modeSwitchBtn');
  const activeEngineChip = document.getElementById('activeEngineChip');
  const lumaControlsBar = document.getElementById('lumaControlsBar');
  const lumaModelSelect = document.getElementById('lumaModelSelect');
  const ratioBtns = document.querySelectorAll('.ratio-btn');

  // Status Badges
  const aiStatusBadge = document.getElementById('aiStatusBadge');
  const lumaStatusBadge = document.getElementById('lumaStatusBadge');

  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  
  // Settings Tabs
  const tabGeminiBtn = document.getElementById('tabGeminiBtn');
  const tabLumaBtn = document.getElementById('tabLumaBtn');
  const geminiTabPane = document.getElementById('geminiTabPane');
  const lumaTabPane = document.getElementById('lumaTabPane');

  // Gemini Settings Inputs
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
  const modalConnectionStatus = document.getElementById('modalConnectionStatus');

  // Luma Settings Inputs
  const lumaApiKeyInput = document.getElementById('lumaApiKeyInput');
  const modalLumaModelSelect = document.getElementById('modalLumaModelSelect');
  const toggleLumaKeyVisibility = document.getElementById('toggleLumaKeyVisibility');
  const testLumaBtn = document.getElementById('testLumaBtn');
  const modalLumaConnectionStatus = document.getElementById('modalLumaConnectionStatus');

  // --- Configuration ---
  const DEFAULT_GEMINI_KEY = "";
  const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
  const DEFAULT_LUMA_KEY = "";
  const DEFAULT_LUMA_MODEL = "uni-1";
  const SESSIONS_STORAGE_KEY = "ather_chat_sessions";
  
  const SYSTEM_INSTRUCTION = `You are the Ather3D AI Assistant, an advanced spatial artificial intelligence integrated directly into the Ather3D Workspace.
Ather3D is a next-generation platform for AR/VR 3D models, digital twins, real-time WebGL rendering (Three.js), and spatial immersive environments.
Your responsibilities:
- Provide concise, practical, technical assistance on 3D modeling, asset topology, and polygon budgeting.
- Help optimize WebGL shaders, Three.js scenes, PBR texture maps (Albedo, Normal, Roughness, Metalness, ORM), and WebXR setups.
- Guide users on GLTF/GLB inspection, Draco geometry compression, and spatial scene hierarchy.
- Maintain an encouraging, futuristic, and expert engineering tone.
- Format responses cleanly with bullet points, bold highlights, and code blocks where helpful.`;

  // Pre-configured Prompt Suggestions
  const GEMINI_SUGGESTIONS = [
    { text: "Generate real-time PBR shaders and texture maps for AR models", icon: "fa-wand-magic-sparkles" },
    { text: "Optimize 3D polygon budget & LOD for WebXR performance", icon: "fa-gauge-high" },
    { text: "Construct spatial VR environment lighting and skybox scenes", icon: "fa-sun" },
    { text: "Inspect GLTF/GLB model hierarchy and spatial collider mesh", icon: "fa-layer-group" }
  ];

  const LUMA_SUGGESTIONS = [
    { text: "Futuristic cyberpunk AR showroom with holographic neon pedestals", icon: "fa-cube" },
    { text: "Cinematic 3D camera flythrough of an ancient sci-fi temple for VR", icon: "fa-video" },
    { text: "Photorealistic procedural terrain biome with realistic atmospheric fog", icon: "fa-mountain-sun" },
    { text: "Ultra-detailed sci-fi mecha cockpit with glowing holographic panels", icon: "fa-microchip" }
  ];

  // --- State Variables ---
  let conversationHistory = [];
  let isGenerating = false;
  let currentSessionId = null;
  let currentEngine = 'gemini'; // 'gemini' | 'luma'
  let selectedLumaRatio = '16:9';

  // --- Key & Model Accessors ---
  function getActiveApiKey() {
    return localStorage.getItem('ather_gemini_api_key') || DEFAULT_GEMINI_KEY;
  }

  function getActiveModel() {
    const saved = localStorage.getItem('ather_gemini_model');
    if (!saved || saved.includes('2.5') || saved.includes('1.5')) {
      localStorage.setItem('ather_gemini_model', DEFAULT_GEMINI_MODEL);
      return DEFAULT_GEMINI_MODEL;
    }
    return saved;
  }

  function getActiveLumaKey() {
    return localStorage.getItem('ather_luma_api_key') || DEFAULT_LUMA_KEY;
  }

  function getActiveLumaModel() {
    return localStorage.getItem('ather_luma_model') || DEFAULT_LUMA_MODEL;
  }

  // --- Persistent Chat History Storage ---
  function getStoredSessions() {
    try {
      const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading sessions from localStorage:", e);
      return [];
    }
  }

  function saveStoredSessions(sessions) {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Error saving sessions to localStorage:", e);
    }
  }

  function generateSessionTitle(promptText) {
    const cleaned = promptText.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 28) return cleaned;
    return cleaned.slice(0, 28) + '...';
  }

  // Render the Chat History list in sidebar
  function renderChatHistoryList() {
    const sessions = getStoredSessions();
    recentList.innerHTML = '';

    if (sessions.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-history-text';
      emptyLi.textContent = 'No previous chats';
      recentList.appendChild(emptyLi);
      return;
    }

    sessions.forEach((session) => {
      const li = document.createElement('li');
      li.className = `chat-item ${session.id === currentSessionId ? 'active' : ''}`;
      li.setAttribute('data-id', session.id);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'chat-title';
      
      const iconClass = session.engine === 'luma' ? 'fa-wand-magic-sparkles' : 'fa-message';
      titleSpan.innerHTML = `<i class="fa-regular ${iconClass}" style="margin-right: 6px; font-size: 11px; opacity: 0.7;"></i>${escapeHtml(session.title)}`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-chat-btn';
      deleteBtn.title = 'Delete Session';
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(session.id);
      });

      li.appendChild(titleSpan);
      li.appendChild(deleteBtn);

      li.addEventListener('click', () => {
        loadSession(session.id);
      });

      recentList.appendChild(li);
    });
  }

  // Load a session from history
  function loadSession(sessionId) {
    if (isGenerating) return;

    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    currentSessionId = sessionId;
    conversationHistory = [];
    messagesList.innerHTML = '';
    welcomeBox.style.display = 'none';

    // Set engine based on session
    if (session.engine === 'luma') {
      setEngine('luma');
    } else {
      setEngine('gemini');
    }

    // Highlight active sidebar item
    document.querySelectorAll('.chat-item').forEach((item) => {
      item.classList.toggle('active', item.getAttribute('data-id') === sessionId);
    });

    // Populate conversation stream
    session.messages.forEach((msg) => {
      const messageEl = document.createElement('div');

      if (msg.role === 'user') {
        messageEl.classList.add('message', 'user');
        messageEl.innerHTML = `<div class="bubble">${escapeHtml(msg.text)}</div>`;
        conversationHistory.push({ role: 'user', parts: [{ text: msg.text }] });
      } else if (msg.role === 'luma') {
        messageEl.classList.add('message', 'luma-message');
        messageEl.innerHTML = renderCompletedLumaCardHtml(msg);
      } else {
        messageEl.classList.add('message', 'bot');
        messageEl.innerHTML = `
          <div class="bot-avatar" title="Ather3D Core"><i class="fa-solid fa-cube"></i></div>
          <div class="bubble">${formatMarkdown(msg.text)}</div>
        `;
        conversationHistory.push({ role: 'model', parts: [{ text: msg.text }] });
      }

      messagesList.appendChild(messageEl);
    });

    scrollToBottom();
  }

  // Helper to render completed Luma generation card
  function renderCompletedLumaCardHtml(msg) {
    const isVideo = msg.assetType === 'video' || (msg.assetUrl && msg.assetUrl.endsWith('.mp4'));
    const mediaHtml = isVideo
      ? `<video src="${escapeHtml(msg.assetUrl)}" controls autoplay loop muted playsinline></video>`
      : `<img src="${escapeHtml(msg.assetUrl)}" alt="Generated 3D Asset" loading="lazy" />`;

    return `
      <div class="luma-card-container">
        <div class="luma-card-header">
          <div class="luma-card-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Luma AI Asset (${escapeHtml(msg.model || 'uni-1')})</span>
          </div>
          <span class="luma-state-pill completed">
            <i class="fa-solid fa-check"></i> Completed
          </span>
        </div>
        <div class="luma-prompt-quote">
          "${escapeHtml(msg.prompt || msg.text || '')}"
        </div>
        <div class="luma-media-container">
          ${mediaHtml}
        </div>
        <div class="luma-media-toolbar">
          <a href="${escapeHtml(msg.assetUrl)}" target="_blank" download class="luma-action-btn">
            <i class="fa-solid fa-download"></i> Download Asset
          </a>
          <button type="button" class="luma-action-btn" onclick="navigator.clipboard.writeText('${escapeHtml(msg.assetUrl)}'); alert('Asset link copied to clipboard!');">
            <i class="fa-regular fa-copy"></i> Copy Link
          </button>
        </div>
      </div>
    `;
  }

  // Delete session from history
  function deleteSession(sessionId) {
    let sessions = getStoredSessions();
    sessions = sessions.filter((s) => s.id !== sessionId);
    saveStoredSessions(sessions);

    if (currentSessionId === sessionId) {
      startNewChat();
    } else {
      renderChatHistoryList();
    }
  }

  // Start a fresh new chat session
  function startNewChat() {
    if (isGenerating) return;
    currentSessionId = null;
    conversationHistory = [];
    messagesList.innerHTML = '';
    welcomeBox.style.display = 'block';
    promptInput.value = '';
    promptInput.style.height = 'auto';
    sendBtn.disabled = true;

    document.querySelectorAll('.chat-item').forEach((item) => item.classList.remove('active'));
    renderChatHistoryList();
    promptInput.focus();
  }

  // --- Engine Switching (Gemini vs Luma) ---
  function setEngine(mode) {
    currentEngine = mode;

    if (mode === 'gemini') {
      engineGeminiBtn?.classList.add('active');
      engineLumaBtn?.classList.remove('active');
      if (activeEngineChip) activeEngineChip.textContent = 'Gemini';
      if (lumaControlsBar) lumaControlsBar.style.display = 'none';
      if (promptInput) promptInput.placeholder = 'Ask Ather3D about 3D models, shaders, or environments...';
      if (welcomeGreetingSubject) welcomeGreetingSubject.textContent = 'Creator';
      if (welcomeSubtitle) welcomeSubtitle.textContent = 'How can Ather3D assist your 3D models and spatial environments today?';
      if (inputDisclaimer) inputDisclaimer.textContent = 'Ather3D AI helps optimize 3D assets. Please verify polygon counts, transforms, and spatial scale.';
      renderSuggestionCards(GEMINI_SUGGESTIONS);
    } else {
      engineLumaBtn?.classList.add('active');
      engineGeminiBtn?.classList.remove('active');
      if (activeEngineChip) activeEngineChip.textContent = 'Luma AI';
      if (lumaControlsBar) lumaControlsBar.style.display = 'flex';
      if (promptInput) promptInput.placeholder = 'Describe a 3D visual, texture, or spatial scene to generate with Luma AI...';
      if (welcomeGreetingSubject) welcomeGreetingSubject.textContent = '3D Artist';
      if (welcomeSubtitle) welcomeSubtitle.textContent = 'Synthesize generative 3D assets, PBR textures, and spatial video with Luma AI.';
      if (inputDisclaimer) inputDisclaimer.textContent = 'Luma AI generates generative 3D visual concepts & video scenes powered by Ray & Uni.';
      renderSuggestionCards(LUMA_SUGGESTIONS);
    }
  }

  function renderSuggestionCards(suggestions) {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';
    suggestions.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.setAttribute('data-prompt', item.text);
      btn.innerHTML = `
        <span class="card-text">${escapeHtml(item.text)}</span>
        <div class="card-icon-wrapper">
          <i class="fa-solid ${item.icon}"></i>
        </div>
      `;
      btn.addEventListener('click', () => {
        if (!isGenerating) handleSend(item.text);
      });
      cardsGrid.appendChild(btn);
    });
  }

  engineGeminiBtn?.addEventListener('click', () => setEngine('gemini'));
  engineLumaBtn?.addEventListener('click', () => setEngine('luma'));
  modeSwitchBtn?.addEventListener('click', () => {
    setEngine(currentEngine === 'gemini' ? 'luma' : 'gemini');
  });

  // Aspect Ratio Selection
  ratioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      ratioBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLumaRatio = btn.getAttribute('data-ratio') || '16:9';
    });
  });

  // Model change in controls bar syncs with default
  lumaModelSelect?.addEventListener('change', () => {
    localStorage.setItem('ather_luma_model', lumaModelSelect.value);
  });

  // --- Sidebar Collapse / Expand ---
  menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // --- Auto-resize input & toggle send button ---
  promptInput?.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${Math.min(promptInput.scrollHeight, 160)}px`;
    sendBtn.disabled = promptInput.value.trim() === '' || isGenerating;
  });

  // --- Handle Enter Key ---
  promptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        handleSend();
      }
    }
  });

  sendBtn?.addEventListener('click', () => {
    if (!sendBtn.disabled) {
      handleSend();
    }
  });

  newChatBtn?.addEventListener('click', startNewChat);

  // --- Main Dispatcher for Sending Prompts ---
  async function handleSend(overrideText) {
    const text = overrideText || promptInput.value.trim();
    if (!text || isGenerating) return;

    // Check if user explicitly typed /luma prefix
    if (text.startsWith('/luma ')) {
      const cleanPrompt = text.replace('/luma ', '').trim();
      setEngine('luma');
      handleLumaSend(cleanPrompt);
      return;
    }

    if (currentEngine === 'luma') {
      handleLumaSend(text);
    } else {
      handleGeminiSend(text);
    }
  }

  // --- Gemini AI Request Handler ---
  async function handleGeminiSend(text) {
    isGenerating = true;
    welcomeBox.style.display = 'none';

    // 1. Session Initialization
    let sessions = getStoredSessions();
    if (!currentSessionId) {
      currentSessionId = 'session_' + Date.now();
      const newSession = {
        id: currentSessionId,
        title: generateSessionTitle(text),
        createdAt: new Date().toISOString(),
        engine: 'gemini',
        messages: []
      };
      sessions.unshift(newSession);
      saveStoredSessions(sessions);
      renderChatHistoryList();
    }

    // 2. Render User Message
    appendMessage(text, 'user');

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession) {
      currentSession.messages.push({ role: 'user', text });
      saveStoredSessions(sessions);
    }

    // Reset input
    promptInput.value = '';
    promptInput.style.height = 'auto';
    sendBtn.disabled = true;

    // 3. Append to Gemini context
    conversationHistory.push({
      role: 'user',
      parts: [{ text }]
    });

    // 4. Render Initial Bot Loading Bubble
    const botMessageEl = appendMessage('', 'bot');
    const bubble = botMessageEl.querySelector('.bubble');
    bubble.innerHTML = '<span style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Ather3D is reasoning about 3D topology & shaders...</span>';
    scrollToBottom();

    // 5. Request Google Gemini API (Direct if custom key configured, or via backend /api/chat)
    const apiKey = getActiveApiKey();
    const preferredModel = getActiveModel();

    try {
      let response;
      let data;

      if (apiKey) {
        // Resilient failover cascade for direct API key
        const candidateModels = [
          preferredModel,
          'gemini-flash-latest',
          'gemini-3.5-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash-lite'
        ].filter((m, i, arr) => m && arr.indexOf(m) === i);

        let lastErrData = null;

        for (const candModel of candidateModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candModel}:generateContent?key=${apiKey}`;
            const requestBody = {
              system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents: conversationHistory,
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            };

            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });

            data = await response.json();

            if (response.ok) break;

            const errText = data.error?.message || '';
            const isHighDemand = 
              response.status === 503 || 
              response.status === 429 || 
              errText.toLowerCase().includes('high demand') ||
              errText.toLowerCase().includes('overloaded');

            if (isHighDemand && candModel !== candidateModels[candidateModels.length - 1]) {
              console.warn(`[Ather3D] Model ${candModel} high demand (HTTP ${response.status}). Failing over to next candidate...`);
              await new Promise(r => setTimeout(r, 600));
              continue;
            }

            lastErrData = data;
          } catch (fetchErr) {
            console.warn(`[Ather3D] Model ${candModel} request failed:`, fetchErr);
          }
        }

        if (!response || !response.ok) {
          data = lastErrData || data || {};
        }
      } else {
        // Use resilient backend proxy /api/chat
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: conversationHistory,
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            model: preferredModel
          })
        });
        data = await response.json();
      }

      if (!response.ok || (data.success === false && !data.candidates && !data.reply)) {
        const errorMsg = data.error?.message || data.message || `HTTP ${response.status} ${response.statusText}`;
        const isHighDemand = errorMsg.toLowerCase().includes('high demand') || response.status === 503;
        
        const helpNote = isHighDemand
          ? "Google Gemini servers are experiencing temporary regional traffic. You can retry immediately with the resilient fallback model below."
          : "Configure your API key in <a href='#' id='errorSettingsLink' style='color: var(--accent-purple);'>Settings</a> or Backend/.env.";

        bubble.innerHTML = `
          <span style="color: #f87171;">
            <i class="fa-solid fa-triangle-exclamation"></i> <strong>AI Assistant Notice:</strong> ${escapeHtml(errorMsg)}<br/>
            <small style="color: var(--text-muted); margin-top: 4px; display: block;">${helpNote}</small>
            <button id="quickRetryPromptBtn" style="margin-top: 8px; padding: 4px 12px; background: rgba(192, 132, 252, 0.15); border: 1px solid rgba(192, 132, 252, 0.4); border-radius: 6px; color: #c084fc; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
              <i class="fa-solid fa-rotate-right"></i> Retry Prompt
            </button>
          </span>
        `;
        
        document.getElementById('errorSettingsLink')?.addEventListener('click', (e) => {
          e.preventDefault();
          openSettingsModal();
        });

        document.getElementById('quickRetryPromptBtn')?.addEventListener('click', () => {
          localStorage.setItem('ather_gemini_model', 'gemini-flash-latest');
          if (promptInput) {
            promptInput.value = text;
            handleSendMessage();
          }
        });
        
        conversationHistory.pop();
        if (currentSession) {
          currentSession.messages.pop();
          saveStoredSessions(sessions);
        }
        return;
      }

      const replyText = data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";

      conversationHistory.push({
        role: 'model',
        parts: [{ text: replyText }]
      });

      if (currentSession) {
        currentSession.messages.push({ role: 'model', text: replyText });
        saveStoredSessions(sessions);
      }

      await typeOutResponse(bubble, replyText);

    } catch (err) {
      console.error('Gemini API Fetch Error:', err);
      bubble.innerHTML = `<span style="color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> Network error connecting to Gemini API. Please check your network connection or verify your API key in Settings.</span>`;
      conversationHistory.pop();
      if (currentSession) {
        currentSession.messages.pop();
        saveStoredSessions(sessions);
      }
    } finally {
      isGenerating = false;
      sendBtn.disabled = promptInput.value.trim() === '';
    }
  }

  // --- Luma AI Generative Request Handler ---
  async function handleLumaSend(promptText) {
    isGenerating = true;
    welcomeBox.style.display = 'none';

    // 1. Session Initialization
    let sessions = getStoredSessions();
    if (!currentSessionId) {
      currentSessionId = 'session_' + Date.now();
      const newSession = {
        id: currentSessionId,
        title: generateSessionTitle(promptText),
        createdAt: new Date().toISOString(),
        engine: 'luma',
        messages: []
      };
      sessions.unshift(newSession);
      saveStoredSessions(sessions);
      renderChatHistoryList();
    }

    // 2. Render User Message
    appendMessage(promptText, 'user');

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession) {
      currentSession.messages.push({ role: 'user', text: promptText });
      saveStoredSessions(sessions);
    }

    promptInput.value = '';
    promptInput.style.height = 'auto';
    sendBtn.disabled = true;

    // 3. Render Initial Luma Generation Card
    const lumaMessageEl = document.createElement('div');
    lumaMessageEl.classList.add('message', 'luma-message');
    
    const cardId = 'luma_card_' + Date.now();
    const activeModel = lumaModelSelect?.value || getActiveLumaModel();
    const activeRatio = selectedLumaRatio;

    lumaMessageEl.innerHTML = `
      <div class="luma-card-container" id="${cardId}">
        <div class="luma-card-header">
          <div class="luma-card-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Luma Generative Studio (${escapeHtml(activeModel)})</span>
          </div>
          <span class="luma-state-pill queued" id="${cardId}_pill">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Queued
          </span>
        </div>
        <div class="luma-prompt-quote">
          "${escapeHtml(promptText)}"
        </div>
        <div class="luma-progress-wrapper" id="${cardId}_progress">
          <div class="luma-progress-bar">
            <div class="luma-progress-fill" style="width: 30%;"></div>
          </div>
          <div class="luma-progress-hint">
            <span id="${cardId}_hint">Contacting Luma Agents API...</span>
            <span id="${cardId}_ratio">Ratio: ${escapeHtml(activeRatio)}</span>
          </div>
        </div>
        <div id="${cardId}_content"></div>
      </div>
    `;

    messagesList.appendChild(lumaMessageEl);
    scrollToBottom();

    // 4. Submit to Backend /api/luma/generations
    try {
      const lumaApiKey = getActiveLumaKey();
      const response = await fetch('/api/luma/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-luma-key': lumaApiKey
        },
        body: JSON.stringify({
          prompt: promptText,
          model: activeModel,
          aspect_ratio: activeRatio
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const errorMsg = resData.error?.message || resData.message || (typeof resData.error === 'string' ? resData.error : 'Generation request failed');
        const pill = document.getElementById(`${cardId}_pill`);
        if (pill) {
          pill.className = 'luma-state-pill failed';
          pill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Failed';
        }
        const hint = document.getElementById(`${cardId}_hint`);
        if (hint) {
          hint.innerHTML = `<span style="color: #f87171;">${escapeHtml(errorMsg)}</span>`;
        }
        isGenerating = false;
        sendBtn.disabled = promptInput.value.trim() === '';
        return;
      }

      const generation = resData.data;
      const genId = generation.id;

      // Update Card State to Dreaming
      const pill = document.getElementById(`${cardId}_pill`);
      if (pill) {
        pill.className = 'luma-state-pill dreaming';
        pill.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin"></i> Dreaming...';
      }
      const hint = document.getElementById(`${cardId}_hint`);
      if (hint) {
        hint.textContent = 'Synthesizing 3D generative diffusion...';
      }

      // 5. Start Polling Loop
      pollLumaGeneration(genId, cardId, promptText, activeModel, currentSession, sessions);

    } catch (err) {
      console.error('Luma generation error:', err);
      const pill = document.getElementById(`${cardId}_pill`);
      if (pill) {
        pill.className = 'luma-state-pill failed';
        pill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
      }
      const hint = document.getElementById(`${cardId}_hint`);
      if (hint) {
        hint.innerHTML = `<span style="color: #f87171;">Connection error. Please verify your Luma API Key in Settings.</span>`;
      }
      isGenerating = false;
      sendBtn.disabled = promptInput.value.trim() === '';
    }
  }

  // --- Polling Luma Generation Progress ---
  function pollLumaGeneration(genId, cardId, promptText, model, currentSession, sessions) {
    const lumaApiKey = getActiveLumaKey();
    const maxAttempts = 60; // 60 * 3s = 3 minutes
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        isGenerating = false;
        sendBtn.disabled = promptInput.value.trim() === '';
        const pill = document.getElementById(`${cardId}_pill`);
        if (pill) {
          pill.className = 'luma-state-pill failed';
          pill.innerHTML = '<i class="fa-solid fa-clock"></i> Timed Out';
        }
        return;
      }

      try {
        const res = await fetch(`/api/luma/generations/${genId}`, {
          headers: { 'x-luma-key': lumaApiKey }
        });
        const json = await res.json();

        if (!res.ok || !json.success) return;

        const data = json.data;
        const state = data.state; // 'queued' | 'dreaming' | 'completed' | 'failed'

        const pill = document.getElementById(`${cardId}_pill`);
        const hint = document.getElementById(`${cardId}_hint`);
        const progressWrapper = document.getElementById(`${cardId}_progress`);
        const contentDiv = document.getElementById(`${cardId}_content`);

        if (state === 'dreaming') {
          if (pill) {
            pill.className = 'luma-state-pill dreaming';
            pill.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Dreaming...';
          }
          if (hint) {
            hint.textContent = `Rendering high-detail assets (${attempts * 3}s elapsed)...`;
          }
        } else if (state === 'completed') {
          clearInterval(interval);
          isGenerating = false;
          sendBtn.disabled = promptInput.value.trim() === '';

          const assetUrl = data.normalizedAssetUrl || data.assets?.video || data.assets?.image || '';
          const assetType = data.normalizedAssetType || (assetUrl.endsWith('.mp4') ? 'video' : 'image');

          if (pill) {
            pill.className = 'luma-state-pill completed';
            pill.innerHTML = '<i class="fa-solid fa-check"></i> Completed';
          }

          if (progressWrapper) {
            progressWrapper.style.display = 'none';
          }

          if (contentDiv && assetUrl) {
            const isVideo = assetType === 'video' || assetUrl.endsWith('.mp4');
            const mediaHtml = isVideo
              ? `<video src="${escapeHtml(assetUrl)}" controls autoplay loop muted playsinline></video>`
              : `<img src="${escapeHtml(assetUrl)}" alt="Generated 3D Asset" loading="lazy" />`;

            contentDiv.innerHTML = `
              <div class="luma-media-container" style="margin-top: 10px;">
                ${mediaHtml}
              </div>
              <div class="luma-media-toolbar">
                <a href="${escapeHtml(assetUrl)}" target="_blank" download="ather3d-luma-asset" class="luma-action-btn">
                  <i class="fa-solid fa-download"></i> Download Asset
                </a>
                <button type="button" class="luma-action-btn" id="${cardId}_copyBtn">
                  <i class="fa-regular fa-copy"></i> Copy Link
                </button>
              </div>
            `;

            document.getElementById(`${cardId}_copyBtn`)?.addEventListener('click', () => {
              navigator.clipboard.writeText(assetUrl);
              alert('Luma asset URL copied to clipboard!');
            });
          }

          if (currentSession) {
            currentSession.messages.push({
              role: 'luma',
              prompt: promptText,
              assetUrl,
              assetType,
              model
            });
            saveStoredSessions(sessions);
          }

          scrollToBottom();

        } else if (state === 'failed') {
          clearInterval(interval);
          isGenerating = false;
          sendBtn.disabled = promptInput.value.trim() === '';

          if (pill) {
            pill.className = 'luma-state-pill failed';
            pill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Failed';
          }
          if (hint) {
            hint.innerHTML = `<span style="color: #f87171;">Generation failed: ${escapeHtml(data.failure_reason || 'Diffusion error')}</span>`;
          }
        }
      } catch (e) {
        console.error('Luma poll loop error:', e);
      }
    }, 3000);
  }

  // --- Type-out Streaming Effect ---
  function typeOutResponse(bubbleElement, fullText) {
    return new Promise((resolve) => {
      bubbleElement.innerHTML = '';
      let index = 0;
      const chunkSize = 3;
      
      const interval = setInterval(() => {
        if (index < fullText.length) {
          const chunk = fullText.slice(0, index + chunkSize);
          bubbleElement.innerHTML = formatMarkdown(chunk);
          index += chunkSize;
          scrollToBottom();
        } else {
          bubbleElement.innerHTML = formatMarkdown(fullText);
          clearInterval(interval);
          scrollToBottom();
          resolve();
        }
      }, 10);
    });
  }

  // --- Format Markdown Text to HTML ---
  function formatMarkdown(text) {
    let formatted = escapeHtml(text);

    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre style="background: #09090d; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; margin: 8px 0; overflow-x: auto; font-family: monospace; font-size: 13px; color: #e9d5ff;"><code>$1</code></pre>');

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(168, 85, 247, 0.12); color: #d8b4fe; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>');

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>');

    // Bullet points
    formatted = formatted.replace(/^\s*[\*\-]\s+(.*)$/gm, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="color: var(--accent-purple);">•</span><span>$1</span></div>');

    // Numbered lists
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="color: var(--accent-purple); font-weight: 600;">$1.</span><span>$2</span></div>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  function appendMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender);

    if (sender === 'user') {
      messageEl.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
    } else {
      messageEl.innerHTML = `
        <div class="bot-avatar" title="Ather3D Core"><i class="fa-solid fa-cube"></i></div>
        <div class="bubble"></div>
      `;
    }

    messagesList.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Settings Modal Logic ---
  function openSettingsModal(defaultTab = 'gemini') {
    // Populate Gemini fields
    apiKeyInput.value = getActiveApiKey();
    modelSelect.value = getActiveModel();

    // Populate Luma fields
    lumaApiKeyInput.value = getActiveLumaKey();
    modalLumaModelSelect.value = getActiveLumaModel();

    // Set active tab
    switchSettingsTab(defaultTab);

    settingsModal.style.display = 'flex';
  }

  function closeSettingsModal() {
    settingsModal.style.display = 'none';
  }

  function switchSettingsTab(tabName) {
    if (tabName === 'gemini') {
      tabGeminiBtn?.classList.add('active');
      tabLumaBtn?.classList.remove('active');
      geminiTabPane.style.display = 'block';
      lumaTabPane.style.display = 'none';
    } else {
      tabLumaBtn?.classList.add('active');
      tabGeminiBtn?.classList.remove('active');
      lumaTabPane.style.display = 'block';
      geminiTabPane.style.display = 'none';
    }
  }

  tabGeminiBtn?.addEventListener('click', () => switchSettingsTab('gemini'));
  tabLumaBtn?.addEventListener('click', () => switchSettingsTab('luma'));

  settingsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openSettingsModal('gemini');
  });

  aiStatusBadge?.addEventListener('click', () => {
    openSettingsModal('gemini');
  });

  lumaStatusBadge?.addEventListener('click', () => {
    openSettingsModal('luma');
  });

  closeSettingsBtn?.addEventListener('click', closeSettingsModal);
  cancelSettingsBtn?.addEventListener('click', closeSettingsModal);

  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // Toggle API Key visibility
  toggleKeyVisibility?.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyVisibility.innerHTML = isPassword 
      ? '<i class="fa-solid fa-eye-slash"></i>' 
      : '<i class="fa-solid fa-eye"></i>';
  });

  toggleLumaKeyVisibility?.addEventListener('click', () => {
    const isPassword = lumaApiKeyInput.type === 'password';
    lumaApiKeyInput.type = isPassword ? 'text' : 'password';
    toggleLumaKeyVisibility.innerHTML = isPassword 
      ? '<i class="fa-solid fa-eye-slash"></i>' 
      : '<i class="fa-solid fa-eye"></i>';
  });

  // Test Luma API Connection
  testLumaBtn?.addEventListener('click', async () => {
    const testKey = lumaApiKeyInput.value.trim() || getActiveLumaKey();
    modalLumaConnectionStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color: #c084fc;"></i> <span>Verifying Luma API connectivity...</span>';

    try {
      const res = await fetch('/api/luma/status', {
        headers: { 'x-luma-key': testKey }
      });
      const data = await res.json();

      if (data.connected) {
        modalLumaConnectionStatus.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>Luma AI API: Connected & Ready</span>';
      } else {
        modalLumaConnectionStatus.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #f87171;"></i> <span>${escapeHtml(data.message || 'Authentication failed')}</span>`;
      }
    } catch (e) {
      modalLumaConnectionStatus.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #f87171;"></i> <span>Backend unreachable</span>';
    }
  });

  // Save Settings
  saveSettingsBtn?.addEventListener('click', () => {
    const newKey = apiKeyInput.value.trim();
    const newModel = modelSelect.value;
    const newLumaKey = lumaApiKeyInput.value.trim();
    const newLumaModel = modalLumaModelSelect.value;

    if (newKey) localStorage.setItem('ather_gemini_api_key', newKey);
    if (newModel) localStorage.setItem('ather_gemini_model', newModel);
    if (newLumaKey) localStorage.setItem('ather_luma_api_key', newLumaKey);
    if (newLumaModel) {
      localStorage.setItem('ather_luma_model', newLumaModel);
      if (lumaModelSelect) lumaModelSelect.value = newLumaModel;
    }

    if (aiStatusBadge) {
      aiStatusBadge.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 7px; color: #4ade80; margin-right: 5px;"></i>Gemini Flash`;
    }

    if (lumaStatusBadge) {
      lumaStatusBadge.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="font-size: 8px; color: #c084fc; margin-right: 5px;"></i>Luma Ready`;
    }

    closeSettingsModal();
  });

  // ==========================================================================
  // Visual Studio Controller: Image Generation & 3D Vision Analysis
  // ==========================================================================
  function initVisualStudio() {
    // --- Navigation Elements ---
    const tabViewChat = document.getElementById('tabViewChat');
    const tabViewStudio = document.getElementById('tabViewStudio');
    const viewChatPane = document.getElementById('viewChatPane');
    const viewStudioPane = document.getElementById('viewStudioPane');
    const sideNavChatBtn = document.getElementById('sideNavChatBtn');
    const sideNavGenerateBtn = document.getElementById('sideNavGenerateBtn');
    const sideNavAnalyzeBtn = document.getElementById('sideNavAnalyzeBtn');
    const btnQuickSwitchStudio = document.getElementById('btnQuickSwitchStudio');

    // --- Studio Sub-Tab Elements ---
    const studioTabGenBtn = document.getElementById('studioTabGenBtn');
    const studioTabAnalyzeBtn = document.getElementById('studioTabAnalyzeBtn');
    const studioGenView = document.getElementById('studioGenView');
    const studioAnalyzeView = document.getElementById('studioAnalyzeView');
    const studioActiveEngineBadge = document.getElementById('studioActiveEngineBadge');

    // --- Generator Elements ---
    const genPromptInput = document.getElementById('genPromptInput');
    const genNegativeInput = document.getElementById('genNegativeInput');
    const genEngineSelect = document.getElementById('genEngineSelect');
    const btnRunGenerate = document.getElementById('btnRunGenerate');
    const btnRunGenerateText = document.getElementById('btnRunGenerateText');
    const canvasPlaceholder = document.getElementById('canvasPlaceholder');
    const canvasLoading = document.getElementById('canvasLoading');
    const canvasLoadingLabel = document.getElementById('canvasLoadingLabel');
    const canvasResult = document.getElementById('canvasResult');
    const generatedImageEl = document.getElementById('generatedImageEl');
    const canvasActions = document.getElementById('canvasActions');
    const btnInspectGenerated = document.getElementById('btnInspectGenerated');
    const btnDownloadGenerated = document.getElementById('btnDownloadGenerated');
    const btnCopyGenPrompt = document.getElementById('btnCopyGenPrompt');
    const shelfCount = document.getElementById('shelfCount');
    const shelfThumbnails = document.getElementById('shelfThumbnails');

    // --- Vision Analysis Elements ---
    const analyzeDropZone = document.getElementById('analyzeDropZone');
    const analyzeFileInput = document.getElementById('analyzeFileInput');
    const dropZoneEmpty = document.getElementById('dropZoneEmpty');
    const dropZoneLoaded = document.getElementById('dropZoneLoaded');
    const btnBrowseFile = document.getElementById('btnBrowseFile');
    const btnUseLastGenerated = document.getElementById('btnUseLastGenerated');
    const analyzeThumbEl = document.getElementById('analyzeThumbEl');
    const analyzeFilename = document.getElementById('analyzeFilename');
    const analyzeDimensions = document.getElementById('analyzeDimensions');
    const btnRemoveAnalyzedImage = document.getElementById('btnRemoveAnalyzedImage');
    const analyzeCustomPrompt = document.getElementById('analyzeCustomPrompt');
    const btnRunAnalysis = document.getElementById('btnRunAnalysis');
    const btnRunAnalysisText = document.getElementById('btnRunAnalysisText');
    const reportPlaceholder = document.getElementById('reportPlaceholder');
    const reportLoading = document.getElementById('reportLoading');
    const reportOutput = document.getElementById('reportOutput');
    const reportActions = document.getElementById('reportActions');
    const reportTaskBadge = document.getElementById('reportTaskBadge');
    const reportModelBadge = document.getElementById('reportModelBadge');
    const reportTimeBadge = document.getElementById('reportTimeBadge');
    const reportMarkdownBody = document.getElementById('reportMarkdownBody');
    const btnCopyAnalysisReport = document.getElementById('btnCopyAnalysisReport');
    const btnDiscussInChat = document.getElementById('btnDiscussInChat');

    // --- Studio State ---
    let selectedStylePreset = 'pbr';
    let selectedGenRatio = '16:9';
    let lastGeneratedData = null; // { url, prompt, base64 }
    let currentInspectionImage = null; // { base64, mimeType, filename, dimensions }
    let selectedAnalysisTask = 'topology';
    let lastAnalysisMarkdown = '';

    const STYLE_PRESETS = {
      pbr: "3D model render, PBR textures, 8k resolution, photorealistic, cinematic studio lighting, octane render, Unreal Engine 5, raytraced reflections",
      cyberpunk: "cyberpunk 3D asset, neon volumetric lighting, high tech hard-surface mechanical detailing, futuristic sci-fi aesthetic, 8k render",
      isometric: "isometric 3D diorama, low poly stylized 3D model, vibrant colorful lighting, clean edges, Blender Cycles render",
      texture: "seamless tiling PBR texture map, high detail surface material, albedo and normal depth, orthogonal flat studio lighting, 4k texture",
      gameprop: "game ready 3D prop asset, clean quad topology, neutral backdrop, PBR material maps, stylized realism",
      archviz: "photorealistic architectural interior, modern spatial design, natural daylighting, luxury materials, v-ray render"
    };

    const RATIO_DIMS = {
      '16:9': { width: 1280, height: 720 },
      '1:1': { width: 1024, height: 1024 },
      '9:16': { width: 720, height: 1280 },
      '4:3': { width: 1024, height: 768 }
    };

    const TASK_TITLES = {
      topology: '<i class="fa-solid fa-draw-polygon"></i> Topology Audit',
      materials: '<i class="fa-solid fa-gem"></i> PBR Material Breakdown',
      lighting: '<i class="fa-solid fa-sun"></i> Lighting & Atmosphere',
      prompt_extract: '<i class="fa-solid fa-wand-magic-sparkles"></i> Prompt Extraction',
      game_engine: '<i class="fa-solid fa-cubes-stacked"></i> Engine Viability',
      general: '<i class="fa-solid fa-circle-question"></i> Custom 3D Audit'
    };

    // --- Switch Workspace View (Chat vs Studio) ---
    function switchWorkspaceView(view) {
      if (view === 'chat') {
        viewChatPane.style.display = 'flex';
        viewStudioPane.style.display = 'none';
        tabViewChat?.classList.add('active');
        tabViewStudio?.classList.remove('active');
        sideNavChatBtn?.classList.add('active');
        sideNavGenerateBtn?.classList.remove('active');
        sideNavAnalyzeBtn?.classList.remove('active');
      } else {
        viewChatPane.style.display = 'none';
        viewStudioPane.style.display = 'flex';
        tabViewChat?.classList.remove('active');
        tabViewStudio?.classList.add('active');
        sideNavChatBtn?.classList.remove('active');
      }
    }

    // --- Switch Studio Sub-Tabs (Generate vs Analyze) ---
    function switchStudioSubTab(tab) {
      if (tab === 'generate') {
        studioTabGenBtn?.classList.add('active');
        studioTabAnalyzeBtn?.classList.remove('active');
        studioGenView.style.display = 'flex';
        studioAnalyzeView.style.display = 'none';
        sideNavGenerateBtn?.classList.add('active');
        sideNavAnalyzeBtn?.classList.remove('active');
        if (studioActiveEngineBadge) {
          studioActiveEngineBadge.innerHTML = '<i class="fa-solid fa-bolt" style="color: #c084fc;"></i> Flux 3D Realism + Luma Engine';
        }
      } else {
        studioTabGenBtn?.classList.remove('active');
        studioTabAnalyzeBtn?.classList.add('active');
        studioGenView.style.display = 'none';
        studioAnalyzeView.style.display = 'flex';
        sideNavGenerateBtn?.classList.remove('active');
        sideNavAnalyzeBtn?.classList.add('active');
        if (studioActiveEngineBadge) {
          studioActiveEngineBadge.innerHTML = '<i class="fa-solid fa-microscope" style="color: #4ade80;"></i> Gemini Spatial Vision Intelligence';
        }
      }
    }

    // Header Module Switcher Listeners
    tabViewChat?.addEventListener('click', () => switchWorkspaceView('chat'));
    tabViewStudio?.addEventListener('click', () => {
      switchWorkspaceView('studio');
      switchStudioSubTab('generate');
    });

    // Sidebar Modes Listeners
    sideNavChatBtn?.addEventListener('click', () => switchWorkspaceView('chat'));
    sideNavGenerateBtn?.addEventListener('click', () => {
      switchWorkspaceView('studio');
      switchStudioSubTab('generate');
    });
    sideNavAnalyzeBtn?.addEventListener('click', () => {
      switchWorkspaceView('studio');
      switchStudioSubTab('analyze');
    });
    btnQuickSwitchStudio?.addEventListener('click', () => {
      switchWorkspaceView('studio');
      switchStudioSubTab('generate');
    });

    // Studio Sub-Tabs Listeners
    studioTabGenBtn?.addEventListener('click', () => switchStudioSubTab('generate'));
    studioTabAnalyzeBtn?.addEventListener('click', () => switchStudioSubTab('analyze'));

    // --- Inspiration Chips in Generator ---
    document.querySelectorAll('.gen-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (genPromptInput) {
          genPromptInput.value = chip.getAttribute('data-prompt') || '';
          genPromptInput.focus();
        }
      });
    });

    // --- Style Preset Buttons ---
    document.querySelectorAll('.style-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.style-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedStylePreset = btn.getAttribute('data-preset') || 'pbr';
      });
    });

    // --- Aspect Ratio Chips in Generator ---
    document.querySelectorAll('#genRatioChips .ratio-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#genRatioChips .ratio-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedGenRatio = chip.getAttribute('data-ratio') || '16:9';
      });
    });

    // --- Recent Creations Storage ---
    function getStoredCreations() {
      try {
        const stored = localStorage.getItem('ather_recent_creations');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    function saveStoredCreations(list) {
      try {
        localStorage.setItem('ather_recent_creations', JSON.stringify(list.slice(0, 15)));
      } catch (e) {}
    }

    function renderCreationsShelf() {
      const creations = getStoredCreations();
      if (shelfCount) shelfCount.textContent = `${creations.length} asset${creations.length === 1 ? '' : 's'}`;
      if (!shelfThumbnails) return;

      shelfThumbnails.innerHTML = '';
      if (creations.length === 0) {
        shelfThumbnails.innerHTML = '<span style="font-size: 11px; color: var(--text-muted); align-self: center;">No creations saved yet</span>';
        return;
      }

      creations.forEach((item, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `shelf-thumb-item ${idx === 0 ? 'active' : ''}`;
        thumb.title = item.prompt || 'Generated Asset';
        thumb.innerHTML = `<img src="${item.url}" alt="Thumbnail" />`;
        thumb.addEventListener('click', () => {
          document.querySelectorAll('.shelf-thumb-item').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          displayGeneratedResult(item.url, item.prompt);
        });
        shelfThumbnails.appendChild(thumb);
      });
    }

    function displayGeneratedResult(url, prompt) {
      canvasPlaceholder.style.display = 'none';
      canvasLoading.style.display = 'none';
      canvasResult.style.display = 'flex';
      canvasActions.style.display = 'flex';
      generatedImageEl.src = url;
      lastGeneratedData = { url, prompt };

      if (btnUseLastGenerated) {
        btnUseLastGenerated.style.display = 'inline-flex';
      }
    }

    // --- Image Generator Action ---
    btnRunGenerate?.addEventListener('click', async () => {
      const userPrompt = genPromptInput?.value?.trim();
      if (!userPrompt) {
        alert('Please enter a description for the 3D model or texture you want to generate.');
        genPromptInput?.focus();
        return;
      }

      const engine = genEngineSelect?.value || 'flux';
      const presetAddon = STYLE_PRESETS[selectedStylePreset] || '';
      const fullPrompt = `${userPrompt}, ${presetAddon}`.trim();
      const dims = RATIO_DIMS[selectedGenRatio] || { width: 1280, height: 720 };

      // Set Loading State
      canvasPlaceholder.style.display = 'none';
      canvasResult.style.display = 'none';
      canvasActions.style.display = 'none';
      canvasLoading.style.display = 'flex';
      btnRunGenerate.disabled = true;
      btnRunGenerateText.textContent = 'Generating 3D Asset...';

      if (canvasLoadingLabel) {
        canvasLoadingLabel.textContent = engine === 'luma' 
          ? 'Rendering 3D visual via Luma Dream Machine...' 
          : 'Synthesizing PBR textures & spatial lighting with Flux...';
      }

      try {
        let finalUrl = '';

        if (engine === 'luma') {
          // Request via Luma Generations Backend API
          const response = await fetch('/api/luma/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: fullPrompt,
              model: 'uni-1',
              aspect_ratio: selectedGenRatio
            })
          });

          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Luma API generation failed');
          }

          const genId = data.data?.id;
          if (!genId) throw new Error('No generation ID returned from Luma');

          // Poll for completion (up to 45s)
          let polls = 0;
          while (polls < 30) {
            await new Promise(r => setTimeout(r, 2000));
            polls++;

            const pollRes = await fetch(`/api/luma/generations/${genId}`);
            const pollData = await pollRes.json();
            const state = pollData.data?.state;

            if (state === 'completed') {
              finalUrl = pollData.data?.normalizedAssetUrl;
              break;
            } else if (state === 'failed') {
              throw new Error(pollData.data?.failure_reason || 'Luma generation failed');
            }
          }

          if (!finalUrl) {
            throw new Error('Generation took longer than expected. Please retry.');
          }

        } else {
          // Ultra-Fast High-Res Flux 3D Realism
          const seed = Math.floor(Math.random() * 1000000);
          const encodedPrompt = encodeURIComponent(fullPrompt);
          finalUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&enhance=true&seed=${seed}`;

          // Preload to ensure smooth display
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load generated visual'));
            img.src = finalUrl;
          });
        }

        // Display Result
        displayGeneratedResult(finalUrl, userPrompt);

        // Save to creations history
        const creations = getStoredCreations();
        creations.unshift({
          url: finalUrl,
          prompt: userPrompt,
          timestamp: new Date().toISOString()
        });
        saveStoredCreations(creations);
        renderCreationsShelf();

      } catch (err) {
        console.error('Generation Error:', err);
        canvasLoading.style.display = 'none';
        canvasPlaceholder.style.display = 'block';
        alert(`Generation Error: ${err.message}`);
      } finally {
        btnRunGenerate.disabled = false;
        btnRunGenerateText.textContent = 'Generate 3D Asset';
      }
    });

    // Copy Prompt Button
    btnCopyGenPrompt?.addEventListener('click', () => {
      if (lastGeneratedData?.prompt) {
        navigator.clipboard.writeText(lastGeneratedData.prompt);
        btnCopyGenPrompt.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i>';
        setTimeout(() => {
          btnCopyGenPrompt.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1500);
      }
    });

    // Download Generated Asset Button
    btnDownloadGenerated?.addEventListener('click', async () => {
      if (!lastGeneratedData?.url) return;
      try {
        const link = document.createElement('a');
        link.href = lastGeneratedData.url;
        link.download = `Ather3D_Asset_${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        window.open(lastGeneratedData.url, '_blank');
      }
    });

    // Send Generated Image to Vision Inspector
    btnInspectGenerated?.addEventListener('click', async () => {
      if (!lastGeneratedData?.url) return;

      // Switch to Analysis Tab
      switchStudioSubTab('analyze');

      // Convert URL to Base64 via backend proxy to eliminate CORS
      try {
        const proxyRes = await fetch('/api/chat/proxy-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: lastGeneratedData.url })
        });
        const proxyData = await proxyRes.json();

        if (proxyData.success && proxyData.dataUrl) {
          loadImageForInspection(proxyData.dataUrl, 'generated_3d_asset.png');
        } else {
          loadImageForInspection(lastGeneratedData.url, 'generated_3d_asset.png');
        }
      } catch (e) {
        loadImageForInspection(lastGeneratedData.url, 'generated_3d_asset.png');
      }
    });

    // --- Vision 3D Inspector Logic ---

    // Select Task Cards
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.task-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedAnalysisTask = card.getAttribute('data-task') || 'topology';
      });
    });

    // Helper: Load Image into Dropzone State
    function loadImageForInspection(dataUrl, filename = 'asset.png') {
      currentInspectionImage = {
        dataUrl,
        filename,
        base64: dataUrl
      };

      if (analyzeThumbEl) analyzeThumbEl.src = dataUrl;
      if (analyzeFilename) analyzeFilename.textContent = filename;

      // Calculate dimensions
      const img = new Image();
      img.onload = () => {
        if (analyzeDimensions) {
          analyzeDimensions.textContent = `${img.width} × ${img.height} px • Ready for Audit`;
        }
      };
      img.src = dataUrl;

      dropZoneEmpty.style.display = 'none';
      dropZoneLoaded.style.display = 'flex';
      analyzeDropZone?.classList.remove('dragover');
    }

    // Remove Loaded Image
    btnRemoveAnalyzedImage?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentInspectionImage = null;
      dropZoneLoaded.style.display = 'none';
      dropZoneEmpty.style.display = 'flex';
      if (analyzeFileInput) analyzeFileInput.value = '';
    });

    // File Browse
    btnBrowseFile?.addEventListener('click', () => {
      analyzeFileInput?.click();
    });

    analyzeFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        loadImageForInspection(event.target.result, file.name);
      };
      reader.readAsDataURL(file);
    });

    // Use Last Generated Image in Analysis Dropzone
    btnUseLastGenerated?.addEventListener('click', async () => {
      if (!lastGeneratedData?.url) return;
      try {
        const proxyRes = await fetch('/api/chat/proxy-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: lastGeneratedData.url })
        });
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.dataUrl) {
          loadImageForInspection(proxyData.dataUrl, 'last_generated_asset.png');
        } else {
          loadImageForInspection(lastGeneratedData.url, 'last_generated_asset.png');
        }
      } catch (err) {
        loadImageForInspection(lastGeneratedData.url, 'last_generated_asset.png');
      }
    });

    // Drag and Drop Events
    analyzeDropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      analyzeDropZone.classList.add('dragover');
    });

    analyzeDropZone?.addEventListener('dragleave', () => {
      analyzeDropZone.classList.remove('dragover');
    });

    analyzeDropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      analyzeDropZone.classList.remove('dragover');
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          loadImageForInspection(ev.target.result, file.name);
        };
        reader.readAsDataURL(file);
      }
    });

    // Window Paste Listener for Ctrl+V Image
    window.addEventListener('paste', (e) => {
      if (viewStudioPane.style.display === 'none' || studioAnalyzeView.style.display === 'none') {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (ev) => {
            loadImageForInspection(ev.target.result, 'clipboard_capture.png');
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    });

    // Markdown Formatter for Inspection Report
    function renderMarkdownToHtml(markdownText) {
      if (!markdownText) return '';
      let html = escapeHtml(markdownText);

      // Headers
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

      // Bold & Italic
      html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

      // Code blocks
      html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
      html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

      // Unordered List Items
      html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
      html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      // Numbered List Items
      html = html.replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');

      // Horizontal Rules
      html = html.replace(/^---$/gim, '<hr />');

      // Line breaks
      html = html.replace(/\n\n/gim, '<p></p>');
      html = html.replace(/\n/gim, '<br />');

      return html;
    }

    // --- Run Vision Analysis ---
    btnRunAnalysis?.addEventListener('click', async () => {
      if (!currentInspectionImage?.dataUrl) {
        alert('Please upload, drag & drop, or paste a 3D model render or texture to inspect.');
        return;
      }

      const customPrompt = analyzeCustomPrompt?.value?.trim() || '';

      // Set Loading State
      reportPlaceholder.style.display = 'none';
      reportOutput.style.display = 'none';
      reportActions.style.display = 'none';
      reportLoading.style.display = 'flex';
      btnRunAnalysis.disabled = true;
      btnRunAnalysisText.textContent = 'Auditing Asset...';

      try {
        const response = await fetch('/api/chat/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: currentInspectionImage.dataUrl,
            task: selectedAnalysisTask,
            prompt: customPrompt
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || data.error?.message || 'Vision analysis failed');
        }

        lastAnalysisMarkdown = data.analysis || '';

        // Update Badges
        if (reportTaskBadge) {
          reportTaskBadge.innerHTML = TASK_TITLES[selectedAnalysisTask] || '<i class="fa-solid fa-microscope"></i> 3D Audit';
        }
        if (reportModelBadge) {
          reportModelBadge.innerHTML = `<i class="fa-solid fa-microchip"></i> ${data.modelUsed || 'gemini-flash-latest'}`;
        }
        if (reportTimeBadge) {
          reportTimeBadge.innerHTML = `<i class="fa-regular fa-clock"></i> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Render Markdown Body
        if (reportMarkdownBody) {
          reportMarkdownBody.innerHTML = renderMarkdownToHtml(lastAnalysisMarkdown);
        }

        // Show Output
        reportLoading.style.display = 'none';
        reportOutput.style.display = 'flex';
        reportActions.style.display = 'flex';

      } catch (err) {
        console.error('Vision Analysis Error:', err);
        reportLoading.style.display = 'none';
        reportPlaceholder.style.display = 'block';
        alert(`Vision Analysis Error: ${err.message}`);
      } finally {
        btnRunAnalysis.disabled = false;
        btnRunAnalysisText.textContent = 'Run 3D Vision Analysis';
      }
    });

    // Copy Analysis Report (Markdown)
    btnCopyAnalysisReport?.addEventListener('click', () => {
      if (lastAnalysisMarkdown) {
        navigator.clipboard.writeText(lastAnalysisMarkdown);
        btnCopyAnalysisReport.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i> <span>Copied!</span>';
        setTimeout(() => {
          btnCopyAnalysisReport.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy Report</span>';
        }, 1800);
      }
    });

    // Discuss in Spatial Chat
    btnDiscussInChat?.addEventListener('click', () => {
      if (!lastAnalysisMarkdown) return;

      // Switch to Chat View
      switchWorkspaceView('chat');

      // Pre-fill prompt with audit context
      if (promptInput) {
        const shortSummary = lastAnalysisMarkdown.split('\n').slice(0, 8).join(' ');
        promptInput.value = `I just ran a 3D Vision Audit on my asset. Key findings: "${shortSummary.substring(0, 180)}..."\n\nCan you give me actionable code / Blender steps to implement these optimizations?`;
        promptInput.focus();
        promptInput.dispatchEvent(new Event('input'));
      }
    });

    // Initial render of creations shelf
    renderCreationsShelf();
  }

  // Initial Setup
  if (lumaModelSelect) {
    lumaModelSelect.value = getActiveLumaModel();
  }
  setEngine('gemini');
  renderChatHistoryList();
  initVisualStudio();
});