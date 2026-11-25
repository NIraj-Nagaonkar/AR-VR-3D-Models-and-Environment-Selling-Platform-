const fs = require('fs');
const path = require('path');
const AgentRun = require('./agentRun.model');
const AgentStep = require('./agentStep.model');
const Artifact = require('./artifact.model');
const { startRun, handleDecision, cancelRun } = require('./agent.orchestrator');

const createRun = async (req, res, next) => {
  try {
    const { prompt, title } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'A valid text prompt is required to start an agent run.'
      });
    }

    const run = await startRun({
      userId: req.user._id,
      prompt: prompt.trim(),
      title
    });

    const steps = await AgentStep.find({ runId: run._id }).sort({ index: 1 });

    res.status(202).json({
      success: true,
      data: {
        runId: run._id,
        run,
        steps,
        pendingStep: steps.find(s => s.status === 'PROPOSED') || null
      }
    });
  } catch (err) {
    next(err);
  }
};

const listRuns = async (req, res, next) => {
  try {
    const runs = await AgentRun.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('title status stepCount jobId modelOutput createdAt updatedAt');

    res.json({
      success: true,
      data: { runs }
    });
  } catch (err) {
    next(err);
  }
};

const getRunById = async (req, res, next) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Agent run session not found.'
      });
    }

    const steps = await AgentStep.find({ runId: run._id }).sort({ index: 1 });
    const artifacts = await Artifact.find({ runId: run._id });

    res.json({
      success: true,
      data: {
        run,
        steps,
        artifacts,
        pendingStep: steps.find(s => s.status === 'PROPOSED') || null
      }
    });
  } catch (err) {
    next(err);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, code: 'VALIDATION_FAILED', message: 'Message text required' });
    }

    const run = await AgentRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Agent run not found.' });
    }

    run.messages.push({ role: 'user', text: message.trim(), createdAt: new Date() });
    await run.save();

    res.json({ success: true, data: { run } });
  } catch (err) {
    next(err);
  }
};

const submitDecision = async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!['allow', 'deny'].includes(decision)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Decision must be either "allow" or "deny".'
      });
    }

    const { run, step } = await handleDecision({
      runId: req.params.id,
      stepId: req.params.stepId,
      decision,
      note
    });

    const steps = await AgentStep.find({ runId: run._id }).sort({ index: 1 });

    res.json({
      success: true,
      data: {
        run,
        step,
        steps,
        pendingStep: steps.find(s => s.status === 'PROPOSED') || null
      }
    });
  } catch (err) {
    next(err);
  }
};

const cancelRunSession = async (req, res, next) => {
  try {
    const run = await cancelRun(req.params.id);
    res.json({
      success: true,
      data: { run }
    });
  } catch (err) {
    next(err);
  }
};

const streamArtifact = async (req, res, next) => {
  try {
    const artifact = await Artifact.findById(req.params.artifactId);
    if (!artifact || !fs.existsSync(artifact.filePath)) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Artifact file not found on server.'
      });
    }

    res.setHeader('Content-Type', artifact.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${artifact.fileName}"`);

    const stream = fs.createReadStream(artifact.filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

const getAgentHealth = async (req, res) => {
  const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
  const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';

  res.json({
    success: true,
    data: {
      unityInstalled: fs.existsSync(unityExe),
      unityExePath: unityExe,
      projectPath,
      projectExists: fs.existsSync(projectPath),
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      lumaKeyConfigured: !!process.env.LUMA_API_KEY,
      maxSteps: parseInt(process.env.AGENT_MAX_STEPS, 10) || 12,
      approvalTtlMinutes: parseInt(process.env.AGENT_APPROVAL_TTL_MIN, 10) || 15
    }
  });
};

module.exports = {
  createRun,
  listRuns,
  getRunById,
  addMessage,
  submitDecision,
  cancelRunSession,
  streamArtifact,
  getAgentHealth
};
