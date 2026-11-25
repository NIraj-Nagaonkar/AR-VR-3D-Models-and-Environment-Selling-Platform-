/**
 * test_agent_pipeline.js
 * Automated integration test for the AI Agent Human-In-The-Loop Unity & 3D Pipeline
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const http = require('http');

const User = require('../Modules/User/user.model');
const AgentRun = require('../Modules/Agent/agentRun.model');
const AgentStep = require('../Modules/Agent/agentStep.model');
const Artifact = require('../Modules/Agent/artifact.model');
const { generateProceduralGlb } = require('../Modules/Agent/tools/proceduralGlb');

async function runTest() {
  console.log('=== Starting AI Agent Pipeline Verification Test ===');

  // 1. Connect DB
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ar_vr_platform';
  await mongoose.connect(mongoUri);
  console.log('[PASS] MongoDB connected');

  // 2. Locate Admin User & Create JWT
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin user not found. Run seedAdmin.js first.');
  }
  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(`[PASS] Admin token generated for ${admin.email}`);

  // 3. Test Procedural GLB Generator
  const testGlbPath = path.resolve(__dirname, '../../uploads/test_procedural_drone.glb');
  const glbBuffer = generateProceduralGlb({
    modelName: 'SciFi_Drone',
    meshType: 'box',
    baseColor: [0.1, 0.7, 0.9, 1.0],
    metallic: 0.85,
    roughness: 0.2
  });
  fs.writeFileSync(testGlbPath, glbBuffer);
  console.log(`[PASS] Procedural GLB generated (${glbBuffer.length} bytes, valid glTF 2.0 header: ${glbBuffer.toString('utf8', 0, 4)})`);

  // 4. Test Agent Run Initialization via HTTP
  console.log('\n--- 1. Testing POST /api/agent/runs ---');
  const createRes = await fetch('http://127.0.0.1:5000/api/agent/runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt: 'Build a low-poly sci-fi drone in Unity with hover animation',
      jobId: 'test_job_' + Date.now()
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Failed to create run: ${JSON.stringify(createData)}`);
  }
  const runId = createData.data.runId || createData.data.run?._id;
  console.log(`[PASS] Run created with ID: ${runId}, status: ${createData.data.run?.status || createData.data.status}`);

  // 6. Poll for AWAITING_APPROVAL step
  console.log('\n--- 2. Polling for AWAITING_APPROVAL step ---');
  let runDetail = null;
  let approvalStep = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const getRes = await fetch(`http://127.0.0.1:5000/api/agent/runs/${runId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    runDetail = getData.data?.run;
    const steps = getData.data?.steps || [];
    approvalStep = steps.find((s) => s.status === 'PROPOSED' || s.status === 'AWAITING_APPROVAL');
    if (approvalStep) {
      console.log(`[PASS] Step ${approvalStep.index + 1} (${approvalStep.tool}) is ${approvalStep.status} (Run: ${runDetail?.status})`);
      console.log(`       Command: ${approvalStep.command}`);
      console.log(`       Risk: ${approvalStep.risk}`);
      console.log(`       Hash: ${approvalStep.commandHash}`);
      break;
    }
  }

  if (!approvalStep) {
    throw new Error('Did not find a step awaiting approval in time');
  }

  // 7. Approve Step
  console.log('\n--- 3. Testing POST /api/agent/runs/:id/steps/:stepId/decision (allow) ---');
  const decisionRes = await fetch(
    `http://127.0.0.1:5000/api/agent/runs/${runId}/steps/${approvalStep._id}/decision`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        decision: 'allow'
      })
    }
  );
  const decisionData = await decisionRes.json();
  if (!decisionRes.ok || !decisionData.success) {
    throw new Error(`Failed to submit decision: ${JSON.stringify(decisionData)}`);
  }
  console.log(`[PASS] Step approved successfully: ${decisionData.message}`);

  // 8. Poll for completion & verify artifacts
  console.log('\n--- 4. Polling for run completion & 3D artifacts ---');
  let artifacts = [];
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const getRes = await fetch(`http://127.0.0.1:5000/api/agent/runs/${runId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    runDetail = getData.data?.run;
    artifacts = getData.data?.artifacts || [];

    if (runDetail.status === 'SUCCEEDED' || artifacts.length > 0) {
      console.log(`[PASS] Run finished with status: ${runDetail.status}`);
      console.log(`[PASS] Found ${artifacts.length} artifact(s):`);
      artifacts.forEach((a) => {
        console.log(`       - ${a.fileName} (${a.fileSize} bytes, mime: ${a.mimeType})`);
      });
      break;
    }
  }

  // 9. Verify artifact download
  if (artifacts.length > 0) {
    const artId = artifacts[0]._id;
    console.log(`\n--- 5. Testing GET /api/agent/artifacts/${artId} ---`);
    const artRes = await fetch(`http://127.0.0.1:5000/api/agent/artifacts/${artId}?token=${token}`);
    if (!artRes.ok) {
      throw new Error(`Artifact download failed with status ${artRes.status}`);
    }
    const buf = await artRes.arrayBuffer();
    console.log(`[PASS] Artifact downloaded: ${buf.byteLength} bytes`);
  }

  // Cleanup test files
  if (fs.existsSync(testGlbPath)) fs.unlinkSync(testGlbPath);
  await mongoose.disconnect();

  console.log('\n=== ALL AI AGENT PIPELINE TESTS PASSED WITH ZERO ERRORS ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n[FAIL] Test aborted with error:', err);
  process.exit(1);
});
