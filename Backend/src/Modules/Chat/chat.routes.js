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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, system_instruction })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: data.error 
      });
    }

    // Extract convenient top-level reply string for Unity C#
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({ success: true, reply, data });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
