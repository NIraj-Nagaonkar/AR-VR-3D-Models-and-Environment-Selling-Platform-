const express = require('express');
const router = express.Router();

// Helper to retrieve active Luma API Key
function getLumaKey(req) {
  return (
    req.headers['x-luma-key'] ||
    process.env.LUMA_API_KEY ||
    process.env['Luma  API Key'] ||
    ''
  ).trim();
}

/**
 * @route   GET /api/luma/status
 * @desc    Validate Luma AI API connection & key status
 */
router.get('/status', async (req, res) => {
  try {
    const apiKey = getLumaKey(req);

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        connected: false,
        keyConfigured: false,
        message: 'LUMA_API_KEY is not configured in backend .env'
      });
    }

    // Ping Luma Agents API endpoint to check authentication
    const response = await fetch('https://agents.lumalabs.ai/v1/generations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // An unauthorized response gives 401. A 405 Method Not Allowed or 200 confirms valid auth token.
    if (response.status === 401 || response.status === 403) {
      return res.status(200).json({
        success: false,
        connected: false,
        keyConfigured: true,
        message: 'Luma API key is invalid or unauthorized'
      });
    }

    res.json({
      success: true,
      connected: true,
      keyConfigured: true,
      message: 'Luma AI API connected & ready'
    });
  } catch (error) {
    console.error('Luma status error:', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/luma/generations
 * @desc    Initiate a 3D visual, texture, or spatial video generation
 */
router.post('/generations', async (req, res) => {
  try {
    const apiKey = getLumaKey(req);

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'LUMA_API_KEY is not configured in backend .env or headers'
      });
    }

    const {
      prompt,
      model = 'uni-1',
      aspect_ratio = '16:9',
      type = 'image'
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid generation prompt is required'
      });
    }

    // Build payload conforming to Luma Agents API specifications
    const payload = {
      prompt: prompt.trim(),
      model: model || 'uni-1',
      aspect_ratio: aspect_ratio || '16:9'
    };

    // If generating video with ray-3.2
    if (model === 'ray-3.2' || type === 'video') {
      payload.model = 'ray-3.2';
      payload.type = 'video';
    }

    const response = await fetch('https://agents.lumalabs.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.detail || data.error || data
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Luma generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/luma/generations/:id
 * @desc    Poll generation progress, state, and asset output URLs
 */
router.get('/generations/:id', async (req, res) => {
  try {
    const apiKey = getLumaKey(req);
    const generationId = req.params.id;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'LUMA_API_KEY is not configured'
      });
    }

    const response = await fetch(`https://agents.lumalabs.ai/v1/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.detail || data.error || data
      });
    }

    // Normalize output asset URL for easy consumption by front-end
    let assetUrl = null;
    let assetType = 'image';

    if (data.assets) {
      if (data.assets.video) {
        assetUrl = data.assets.video;
        assetType = 'video';
      } else if (data.assets.image) {
        assetUrl = data.assets.image;
        assetType = 'image';
      }
    } else if (data.video && data.video.url) {
      assetUrl = data.video.url;
      assetType = 'video';
    } else if (data.image && data.image.url) {
      assetUrl = data.image.url;
      assetType = 'image';
    }

    res.json({
      success: true,
      data: {
        ...data,
        normalizedAssetUrl: assetUrl,
        normalizedAssetType: assetType
      }
    });
  } catch (error) {
    console.error('Luma poll error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
