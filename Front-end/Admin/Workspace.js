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
  const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
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
    return localStorage.getItem('ather_gemini_model') || DEFAULT_GEMINI_MODEL;
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
    const model = getActiveModel();

    try {
      let response;
      if (apiKey) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const requestBody = {
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        };

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: conversationHistory,
            system_instruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            model
          })
        });
      }

      const data = await response.json();

      if (!response.ok || (data.success === false && !data.candidates && !data.reply)) {
        const errorMsg = data.error?.message || data.message || `HTTP ${response.status} ${response.statusText}`;
        bubble.innerHTML = `<span style="color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>AI Assistant Error:</strong> ${escapeHtml(errorMsg)}<br/><small style="color: var(--text-muted); margin-top: 4px; display: block;">Configure your API key in <a href="#" id="errorSettingsLink" style="color: var(--accent-purple);">Settings</a> or Backend/.env.</small></span>`;
        
        document.getElementById('errorSettingsLink')?.addEventListener('click', (e) => {
          e.preventDefault();
          openSettingsModal();
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
      aiStatusBadge.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 7px; color: #4ade80; margin-right: 5px;"></i>Gemini 3.6`;
    }

    if (lumaStatusBadge) {
      lumaStatusBadge.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="font-size: 8px; color: #c084fc; margin-right: 5px;"></i>Luma Ready`;
    }

    closeSettingsModal();
  });

  // Initial Setup
  if (lumaModelSelect) {
    lumaModelSelect.value = getActiveLumaModel();
  }
  setEngine('gemini');
  renderChatHistoryList();
});