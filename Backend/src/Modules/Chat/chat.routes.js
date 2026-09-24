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

/**
 * @route   POST /api/chat/analyze-image
 * @desc    Multimodal Vision Analysis for 3D Topology, PBR Materials, Lighting, and Prompts
 */
router.post('/analyze-image', async (req, res) => {
  try {
    let { image, mimeType = 'image/png', prompt, task = 'topology', model = 'gemini-flash-latest' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured in backend .env'
      });
    }

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A base64 encoded image string is required'
      });
    }

    // Strip data URL scheme prefix if included
    let cleanBase64 = image.trim();
    if (cleanBase64.includes(';base64,')) {
      const parts = cleanBase64.split(';base64,');
      cleanBase64 = parts[1];
      const matchMime = parts[0].match(/data:(.*)/);
      if (matchMime && matchMime[1]) {
        mimeType = matchMime[1];
      }
    }

    // Task-specific tailored prompts
    const taskPrompts = {
      topology: `You are a Principal 3D Modeler & Technical Artist. Perform a rigorous 3D Mesh Topology & Geometry Audit of this visual:
1. **Geometry & Polygon Budget**: Estimate polycount category (Low-poly <5k, Mid-poly 5k-25k, High-poly >25k) and recommend target polygon budget for real-time WebGL/Unity.
2. **Edge Flow & Subdivisions**: Analyze edge loops, quad vs triangle layout, curvature preservation, and potential pinching areas.
3. **Hard vs Soft Edges**: Suggest smoothing groups and normal seam placements.
4. **Blender / Maya Workflow**: 3 actionable modeling steps to construct this mesh cleanly.`,

      materials: `You are a Senior Shader and Texture Artist. Perform an in-depth PBR Material & Texture Breakdown of this image:
1. **Material Classification**: Identify distinct surface materials (Metals, Dielectrics, Glass/Clearcoat, Fabrics, Emissives).
2. **PBR Texture Map Breakdown**:
   - **Albedo / Base Color**: Tint, color grading, surface wear/patina.
   - **Normal Map**: Macro details, bevel simulation, surface bump depth.
   - **Roughness / Smoothness**: Matte vs glossy variation across surfaces.
   - **Metallic / Masking**: Metalness contrast zones.
   - **Ambient Occlusion (AO)**: Crevice contact shadowing.
3. **Shader Recommendation**: Parameter setup for Three.js (MeshStandardMaterial) or Unity (URP Lit Shader).
4. **Texture Resolution & UV Guidance**: Recommended resolution (1K/2K/4K) and UV packing tips.`,

      lighting: `You are an AR/VR Lighting and Environmental Artist. Analyze the spatial illumination and atmosphere in this image:
1. **Key, Fill & Rim Lights**: Color temperatures (Kelvin), intensity ratios, and directional angles.
2. **Environment & Ambient Light**: HDRI / IBL reflections, ambient color grading.
3. **Shadows & Occlusion**: Shadow softness, contact shadow density, and light bounce.
4. **Atmospheric / Post-Processing**: Bloom, fog, tone mapping, and volumetric suggestions for Three.js/Unity.`,

      prompt_extract: `You are an AI Prompt Engineer specializing in 3D assets and photorealistic concept art. Reverse-engineer this image:
1. **Detailed Generation Prompt**: A descriptive, high-quality prompt that accurately reproduces this style, subject, and composition.
2. **Negative Prompt**: Undesired artifacts to avoid (e.g., blurry, bad topology, deformed, lowres).
3. **Key Style Keywords**: Core aesthetic tags (e.g. Octane Render, 8K, PBR, ray-traced, cinematic lighting).
4. **Composition & Camera**: Lens angle, camera focal length, and framing.`,

      game_engine: `You are a Game Engine Technical Director. Assess this 3D model / concept for WebGL, Unity, and Unreal Engine integration:
1. **Platform Viability**: Mobile AR (ARKit/ARCore), WebGL (Three.js/Babylon.js), and Desktop PC/VR.
2. **Performance Constraints**: Draw call considerations, alpha-blending vs opaque materials, and texture memory.
3. **LOD (Level of Detail) Strategy**: Recommendations for LOD0, LOD1, and LOD2 mesh simplification.
4. **Collision & Physics**: Recommended bounding box / convex collider setup.
5. **Export Format**: Best export settings (GLTF/GLB Draco compression, embedded textures).`,

      general: `You are the Ather3D Spatial Vision Intelligence. Analyze this 3D visual or reference in comprehensive technical detail, focusing on 3D structure, materials, lighting, and real-time usability.`
    };

    let basePrompt = taskPrompts[task] || taskPrompts.general;
    if (prompt && prompt.trim()) {
      basePrompt += `\n\n**Additional Specific Question / Focus**:\n${prompt.trim()}`;
    }

    // Resilient fallback chain for multimodal vision
    const fallbackModels = [
      model,
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError = null;
    let lastStatus = 500;

    for (const candidateModel of fallbackModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: basePrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            system_instruction: {
              parts: [{
                text: 'You are Ather3D Spatial Vision Intelligence, a technical 3D artist and shader expert. Provide well-structured markdown analysis with bold highlights, bullet points, and actionable tips.'
              }]
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error?.message || '';
          const isHighDemandOrOverloaded = 
            response.status === 503 || 
            response.status === 429 || 
            errorMsg.toLowerCase().includes('high demand') || 
            errorMsg.toLowerCase().includes('overloaded');

          if (isHighDemandOrOverloaded && candidateModel !== fallbackModels[fallbackModels.length - 1]) {
            console.warn(`[Ather3D Vision] Model ${candidateModel} high demand (HTTP ${response.status}). Failing over...`);
            await new Promise(r => setTimeout(r, 600));
            continue;
          }

          lastError = data.error || { message: `HTTP ${response.status} from Gemini API` };
          lastStatus = response.status;
          continue;
        }

        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis could be generated.';
        return res.json({
          success: true,
          task,
          analysis,
          modelUsed: candidateModel,
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.warn(`[Ather3D Vision] Error requesting model ${candidateModel}:`, err.message);
        lastError = { message: err.message };
      }
    }

    return res.status(lastStatus).json({
      success: false,
      error: lastError || { message: 'Image analysis service is currently experiencing high demand. Please retry in a few seconds.' }
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/chat/proxy-image
 * @desc    Convert external image URL to base64 to avoid CORS when inspecting generated images
 */
router.post('/proxy-image', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid image URL is required' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: `Failed to fetch image: HTTP ${response.status}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.json({
      success: true,
      dataUrl: `data:${contentType};base64,${base64}`,
      base64,
      contentType
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
