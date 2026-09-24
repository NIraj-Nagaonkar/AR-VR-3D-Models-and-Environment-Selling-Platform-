const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    let { contents, prompt, message, system_instruction, model = 'gemini-3.6-flash' } = req.body;
    if (!model || model.includes('2.5') || model.includes('1.5')) {
      model = 'gemini-3.6-flash';
    }
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'GEMINI_API_KEY is not configured in backend .env' 
      });
    }

    // Support simple { prompt: "..." } or { message: "..." } from Unity or external clients
    if (!contents && (prompt || message)) {
      const userText = prompt || message;
      contents = [{ role: 'user', parts: [{ text: userText }] }];
    }

    if (!contents) {
      return res.status(400).json({
        success: false,
        message: 'Either contents array or a prompt string is required'
      });
    }

    // Provide default system instruction if omitted
    if (!system_instruction) {
      system_instruction = {
        parts: [{
          text: 'You are Ather3D Spatial AI assistant for Unity AR/VR. Provide concise, direct assistance and 3D technical insights.'
        }]
      };
    }

    // Define resilient model fallback chain
    const fallbackModels = [
      model,
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError = null;
    let lastStatus = 500;

    for (const candidateModel of fallbackModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, system_instruction })
        });

        const data = await response.json();

        // If high demand (503), rate-limited (429), or overloaded, try next fallback model
        if (!response.ok) {
          const errorMsg = data.error?.message || '';
          const isHighDemandOrOverloaded = 
            response.status === 503 || 
            response.status === 429 || 
            errorMsg.toLowerCase().includes('high demand') || 
            errorMsg.toLowerCase().includes('overloaded') ||
            errorMsg.toLowerCase().includes('resource_exhausted');

          if (isHighDemandOrOverloaded && candidateModel !== fallbackModels[fallbackModels.length - 1]) {
            console.warn(`[Ather3D AI] Model ${candidateModel} is experiencing high demand (HTTP ${response.status}). Failing over to next fallback model...`);
            await new Promise(r => setTimeout(r, 600));
            continue;
          }

          lastError = data.error || { message: `HTTP ${response.status} from Gemini API` };
          lastStatus = response.status;
          continue;
        }

        // Successfully generated
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.json({ 
          success: true, 
          reply, 
          data, 
          modelUsed: candidateModel 
        });

      } catch (err) {
        console.warn(`[Ather3D AI] Error requesting model ${candidateModel}:`, err.message);
        lastError = { message: err.message };
      }
    }

    return res.status(lastStatus).json({ 
      success: false, 
      error: lastError || { message: 'All AI models are currently experiencing high demand. Please retry in a few seconds.' }
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
