const path = require('path');
const fs = require('fs');
const AgentRun = require('./agentRun.model');
const AgentStep = require('./agentStep.model');
const Artifact = require('./artifact.model');
const { validateToolCall, calculateCommandHash } = require('./agent.policy');
const { executeTool } = require('./agent.tools');
const { cancelRunProcess } = require('./agent.runner');

const MAX_STEPS = parseInt(process.env.AGENT_MAX_STEPS, 10) || 12;

function getJobDir(jobId) {
  return path.join(__dirname, '..', '..', '..', 'uploads', 'jobs', jobId);
}

async function startRun({ userId, prompt, title }) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const jobDir = getJobDir(jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const run = await AgentRun.create({
    userId,
    jobId,
    title: title || prompt.substring(0, 40) + '...',
    status: 'RUNNING',
    stepCount: 0,
    messages: [
      { role: 'user', text: prompt, createdAt: new Date() }
    ]
  });

  // Advance to first action
  await advanceRun(run._id);
  return run;
}

async function advanceRun(runId) {
  const run = await AgentRun.findById(runId);
  if (!run || ['COMPLETED', 'CANCELLED', 'FAILED'].includes(run.status)) return;

  if (run.stepCount >= MAX_STEPS) {
    run.status = 'COMPLETED';
    run.messages.push({
      role: 'assistant',
      text: `Maximum step limit (${MAX_STEPS}) reached for this generation session. All generated assets are preserved.`,
      createdAt: new Date()
    });
    await run.save();
    return;
  }

  const jobDir = getJobDir(run.jobId);
  const manifestPath = path.join(jobDir, 'manifest.json');
  const glbPath = path.join(jobDir, 'model.glb');
  const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';
  const importedDir = path.join(projectPath, 'Assets', 'Generated', run.jobId);

  // Retrieve steps run so far
  const completedSteps = await AgentStep.find({ runId, status: 'SUCCEEDED' }).sort({ index: 1 });
  const completedTools = completedSteps.map(s => s.tool);

  let nextToolCall = null;

  // Decide next step in the pipeline
  if (!completedTools.includes('plan_model')) {
    nextToolCall = {
      tool: 'plan_model',
      args: { prompt: run.messages[0].text }
    };
  } else if (!completedTools.includes('build_model_unity')) {
    nextToolCall = {
      tool: 'build_model_unity',
      args: { manifestFile: 'manifest.json' }
    };
  } else if (!completedTools.includes('animate_model_unity')) {
    let animPreset = 'spin';
    if (fs.existsSync(manifestPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (m.animations && m.animations.length > 0) {
          animPreset = m.animations[0].preset || 'spin';
        }
      } catch (e) {}
    }
    nextToolCall = {
      tool: 'animate_model_unity',
      args: { preset: animPreset, targetPart: 'root' }
    };
  } else if (!completedTools.includes('import_to_unity')) {
    nextToolCall = {
      tool: 'import_to_unity',
      args: { jobId: run.jobId }
    };
  } else if (!completedTools.includes('open_in_unity')) {
    nextToolCall = {
      tool: 'open_in_unity',
      args: {}
    };
  } else {
    // Pipeline complete
    run.status = 'COMPLETED';
    const glbArtifact = await Artifact.findOne({ runId, kind: 'glb' });
    if (glbArtifact) {
      run.modelOutput = {
        glbUrl: `/api/agent/artifacts/${glbArtifact._id}`,
        unityProjectPath: projectPath,
        summary: `3D model generated, animated, and imported to Unity Project: Assets/Generated/${run.jobId}/`
      };
    }
    run.messages.push({
      role: 'assistant',
      text: `Your 3D model is built and ready in the interactive 3D viewport. It has also been imported into your Unity project at Assets/Generated/${run.jobId}/.`,
      createdAt: new Date()
    });
    await run.save();
    return;
  }

  // Validate next tool call against security policy
  const context = {
    runId: run._id,
    jobId: run.jobId,
    jobDir,
    initialPrompt: run.messages[0].text
  };

  const validated = validateToolCall(nextToolCall.tool, nextToolCall.args, context);

  const stepIndex = run.stepCount + 1;
  const step = await AgentStep.create({
    runId: run._id,
    index: stepIndex,
    tool: validated.tool,
    args: validated.args,
    reason: validated.reason,
    risk: validated.risk,
    command: validated.displayCommand,
    commandHash: validated.commandHash,
    cwd: validated.cwd,
    status: 'PROPOSED'
  });

  run.stepCount = stepIndex;
  run.currentStepId = step._id;
  run.status = 'AWAITING_APPROVAL';

  run.messages.push({
    role: 'assistant',
    text: `I need approval to run step ${stepIndex}: ${validated.reason}.`,
    createdAt: new Date()
  });

  await run.save();
}

async function handleDecision({ runId, stepId, decision, note }) {
  const run = await AgentRun.findById(runId);
  if (!run) throw new Error('Agent run not found');

  const step = await AgentStep.findOne({ _id: stepId, runId });
  if (!step) throw new Error('Step not found for this run');

  if (step.status !== 'PROPOSED') {
    throw new Error(`Step is in status ${step.status}, not awaiting approval.`);
  }

  step.decidedAt = new Date();
  step.decisionNote = note || '';

  if (decision === 'deny') {
    step.status = 'DENIED';
    await step.save();

    run.status = 'AWAITING_APPROVAL';
    run.messages.push({
      role: 'user',
      text: `Denied step ${step.index} (${step.tool})${note ? `: ${note}` : ''}.`,
      createdAt: new Date()
    });
    run.messages.push({
      role: 'assistant',
      text: `Understood. I will adjust the pipeline and bypass that action.`,
      createdAt: new Date()
    });
    await run.save();

    // Advance to next available step
    await advanceRun(run._id);
    return { run, step };
  }

  // User approved: verify command hash
  const currentHash = calculateCommandHash(step.command, step.cwd);
  if (currentHash !== step.commandHash) {
    step.status = 'FAILED';
    step.outputTail = 'Security Alert: Stored command hash mismatch. Execution blocked.';
    await step.save();
    run.status = 'FAILED';
    await run.save();
    throw new Error('Command verification failed: stored command does not match execution hash.');
  }

  step.status = 'RUNNING';
  step.startedAt = new Date();
  await step.save();

  run.status = 'RUNNING';
  await run.save();

  const context = {
    runId: run._id,
    jobId: run.jobId,
    jobDir: getJobDir(run.jobId),
    initialPrompt: run.messages[0].text
  };

  try {
    const result = await executeTool({
      tool: step.tool,
      args: step.args,
      context,
      stepRecord: step
    });

    step.status = result.exitCode === 0 ? 'SUCCEEDED' : 'FAILED';
    step.exitCode = result.exitCode;
    step.outputTail = result.outputTail || '';
    step.endedAt = new Date();
    if (result.artifacts && result.artifacts.length > 0) {
      step.artifacts = result.artifacts;
    }
    await step.save();

    // If GLB was produced, update run.modelOutput
    if (result.glbUrl) {
      run.modelOutput = {
        ...(run.modelOutput || {}),
        glbUrl: result.glbUrl
      };
      await run.save();
    }

    run.messages.push({
      role: 'assistant',
      text: `Completed step ${step.index} (${step.tool}): ${step.outputTail}`,
      createdAt: new Date()
    });
    await run.save();

    // Advance to next step
    await advanceRun(run._id);
  } catch (err) {
    step.status = 'FAILED';
    step.exitCode = 1;
    step.outputTail = err.message;
    step.endedAt = new Date();
    await step.save();

    run.status = 'FAILED';
    run.messages.push({
      role: 'assistant',
      text: `Step ${step.index} encountered an error: ${err.message}`,
      createdAt: new Date()
    });
    await run.save();
  }

  const updatedRun = await AgentRun.findById(runId);
  return { run: updatedRun, step };
}

async function cancelRun(runId) {
  cancelRunProcess(runId.toString());
  const run = await AgentRun.findByIdAndUpdate(
    runId,
    { status: 'CANCELLED' },
    { returnDocument: 'after' }
  );
  return run;
}

module.exports = {
  startRun,
  advanceRun,
  handleDecision,
  cancelRun,
  getJobDir
};
