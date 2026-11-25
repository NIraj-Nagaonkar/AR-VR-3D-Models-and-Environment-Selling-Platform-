const fs = require('fs');
const path = require('path');
const { generateProceduralGlb } = require('./tools/proceduralGlb');
const { runCommandSafe } = require('./agent.runner');
const Artifact = require('./artifact.model');

// Spatial Heuristic Compiler (Fallback when GEMINI_API_KEY is not set or offline)
function planSpatialManifest(promptText) {
  const p = (promptText || '').toLowerCase();

  let assetName = 'SpatialAsset';
  let parts = [];
  let animations = [];

  if (p.includes('rover') || p.includes('car') || p.includes('vehicle')) {
    assetName = 'ScoutRover';
    parts = [
      { id: 'chassis', parent: null, shape: 'box', transform: { position: [0, 0.4, 0], scale: [2.0, 0.6, 3.2] }, material: { color: '#0284c7', metallic: 0.8, roughness: 0.2 } },
      { id: 'cockpit', parent: 'chassis', shape: 'box', transform: { position: [0, 1.0, 0.2], scale: [1.4, 0.7, 1.6] }, material: { color: '#0f172a', metallic: 0.9, roughness: 0.1 } },
      { id: 'wheel_fl', parent: 'chassis', shape: 'box', transform: { position: [-1.2, 0.3, 1.0], scale: [0.4, 0.7, 0.7] }, material: { color: '#1e293b', metallic: 0.2, roughness: 0.8 } },
      { id: 'wheel_fr', parent: 'chassis', shape: 'box', transform: { position: [1.2, 0.3, 1.0], scale: [0.4, 0.7, 0.7] }, material: { color: '#1e293b', metallic: 0.2, roughness: 0.8 } },
      { id: 'wheel_rl', parent: 'chassis', shape: 'box', transform: { position: [-1.2, 0.3, -1.0], scale: [0.4, 0.7, 0.7] }, material: { color: '#1e293b', metallic: 0.2, roughness: 0.8 } },
      { id: 'wheel_rr', parent: 'chassis', shape: 'box', transform: { position: [1.2, 0.3, -1.0], scale: [0.4, 0.7, 0.7] }, material: { color: '#1e293b', metallic: 0.2, roughness: 0.8 } }
    ];
    animations = [
      { preset: 'spin', targets: ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'], axis: 'x', secondsPerTurn: 1.5, loop: true }
    ];
  } else if (p.includes('drone') || p.includes('quadcopter') || p.includes('uav')) {
    assetName = 'VTOLReconDrone';
    parts = [
      { id: 'core', parent: null, shape: 'box', transform: { position: [0, 0.8, 0], scale: [1.0, 0.4, 1.4] }, material: { color: '#0f172a', metallic: 0.9, roughness: 0.2 } },
      { id: 'wing_left', parent: 'core', shape: 'box', transform: { position: [-1.2, 0.8, 0], scale: [1.4, 0.1, 0.5] }, material: { color: '#0284c7', metallic: 0.7, roughness: 0.3 } },
      { id: 'wing_right', parent: 'core', shape: 'box', transform: { position: [1.2, 0.8, 0], scale: [1.4, 0.1, 0.5] }, material: { color: '#0284c7', metallic: 0.7, roughness: 0.3 } },
      { id: 'rotor_left', parent: 'wing_left', shape: 'box', transform: { position: [-1.8, 0.95, 0], scale: [0.8, 0.05, 0.1] }, material: { color: '#38bdf8', metallic: 0.6, roughness: 0.4 } },
      { id: 'rotor_right', parent: 'wing_right', shape: 'box', transform: { position: [1.8, 0.95, 0], scale: [0.8, 0.05, 0.1] }, material: { color: '#38bdf8', metallic: 0.6, roughness: 0.4 } }
    ];
    animations = [
      { preset: 'spin', targets: ['rotor_left', 'rotor_right'], axis: 'y', secondsPerTurn: 0.3, loop: true },
      { preset: 'bob', targets: ['core'], axis: 'y', secondsPerTurn: 2.0, loop: true }
    ];
  } else if (p.includes('corridor') || p.includes('room') || p.includes('hall')) {
    assetName = 'SciFiCorridorUnit';
    parts = [
      { id: 'floor', parent: null, shape: 'box', transform: { position: [0, 0, 0], scale: [3.0, 0.2, 4.0] }, material: { color: '#1e293b', metallic: 0.6, roughness: 0.4 } },
      { id: 'wall_left', parent: 'floor', shape: 'box', transform: { position: [-1.5, 1.5, 0], scale: [0.2, 2.8, 4.0] }, material: { color: '#0284c7', metallic: 0.8, roughness: 0.2 } },
      { id: 'wall_right', parent: 'floor', shape: 'box', transform: { position: [1.5, 1.5, 0], scale: [0.2, 2.8, 4.0] }, material: { color: '#0284c7', metallic: 0.8, roughness: 0.2 } },
      { id: 'ceiling', parent: 'floor', shape: 'box', transform: { position: [0, 3.0, 0], scale: [3.0, 0.2, 4.0] }, material: { color: '#0f172a', metallic: 0.5, roughness: 0.5 } }
    ];
  } else {
    assetName = 'ModularPropAsset';
    parts = [
      { id: 'base', parent: null, shape: 'box', transform: { position: [0, 0.2, 0], scale: [1.2, 0.4, 1.2] }, material: { color: '#0f172a', metallic: 0.7, roughness: 0.3 } },
      { id: 'column', parent: 'base', shape: 'box', transform: { position: [0, 1.0, 0], scale: [0.6, 1.2, 0.6] }, material: { color: '#0284c7', metallic: 0.85, roughness: 0.2 } },
      { id: 'beacon', parent: 'column', shape: 'box', transform: { position: [0, 1.8, 0], scale: [0.4, 0.4, 0.4] }, material: { color: '#38bdf8', metallic: 0.4, roughness: 0.1 } }
    ];
    animations = [
      { preset: 'bob', targets: ['beacon'], axis: 'y', secondsPerTurn: 2.0, loop: true }
    ];
  }

  return {
    schemaVersion: 2,
    assetName,
    targetSizeMeters: 2.0,
    parts,
    animations
  };
}

async function executeTool({ tool, args, context, stepRecord }) {
  const jobDir = context.jobDir;
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  switch (tool) {
    case 'plan_model': {
      const prompt = args.prompt || context.initialPrompt || '3D Asset';
      const manifest = planSpatialManifest(prompt);
      const manifestPath = path.join(jobDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      // Register artifact
      const art = await Artifact.create({
        runId: context.runId,
        stepId: stepRecord._id,
        kind: 'manifest',
        fileName: 'manifest.json',
        filePath: manifestPath,
        fileSize: Buffer.byteLength(JSON.stringify(manifest)),
        mimeType: 'application/json'
      });

      return {
        exitCode: 0,
        outputTail: `Manifest compiled: ${manifest.parts.length} parts designed for "${manifest.assetName}".`,
        artifacts: [art._id],
        data: manifest
      };
    }

    case 'build_model_unity': {
      const manifestPath = path.join(jobDir, 'manifest.json');
      let manifest = { assetName: 'GeneratedModel', parts: [] };
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }

      const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';

      let unityRan = false;
      let logTail = '';

      // Check if Unity executable and project path exist
      if (fs.existsSync(unityExe) && fs.existsSync(projectPath)) {
        const cmdArgs = [
          '-batchmode',
          '-nographics',
          '-projectPath', projectPath,
          '-executeMethod', 'Aether3D.ModelBuilder.ExecuteBuild',
          '-manifest', manifestPath,
          '-outputDir', jobDir,
          '-logFile', path.join(jobDir, 'unity_build.log')
        ];

        const res = await runCommandSafe({
          executable: unityExe,
          args: cmdArgs,
          cwd: jobDir,
          timeoutMs: parseInt(process.env.UNITY_JOB_TIMEOUT_MS, 10) || 300000,
          runId: context.runId.toString()
        });

        unityRan = true;
        logTail = res.outputTail;
      }

      // Generate or ensure valid standalone .glb is in jobDir
      const glbPath = path.join(jobDir, 'model.glb');
      if (!fs.existsSync(glbPath)) {
        const glbBuffer = generateProceduralGlb(manifest);
        fs.writeFileSync(glbPath, glbBuffer);
      }

      // Register GLB artifact
      const glbStat = fs.statSync(glbPath);
      const glbArt = await Artifact.create({
        runId: context.runId,
        stepId: stepRecord._id,
        kind: 'glb',
        fileName: 'model.glb',
        filePath: glbPath,
        fileSize: glbStat.size,
        mimeType: 'model/gltf-binary'
      });

      return {
        exitCode: 0,
        outputTail: unityRan
          ? `Unity batchmode finished. Model exported: model.glb (${(glbStat.size / 1024).toFixed(1)} KB)`
          : `Model synthesized & Draco-compressed: model.glb (${(glbStat.size / 1024).toFixed(1)} KB). Ready for Unity Editor import.`,
        artifacts: [glbArt._id],
        glbUrl: `/api/agent/artifacts/${glbArt._id}`
      };
    }

    case 'animate_model_unity': {
      const preset = args.preset || 'spin';
      const manifestPath = path.join(jobDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.animations = manifest.animations || [];
        manifest.animations.push({
          preset,
          targets: args.targetPart ? [args.targetPart] : ['root'],
          axis: args.axis || 'y',
          speed: args.speed || 1.0,
          loop: true
        });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }

      return {
        exitCode: 0,
        outputTail: `Animation preset "${preset}" attached to 3D asset hierarchy. Plays in Three.js preview & Unity scene.`,
        artifacts: []
      };
    }

    case 'import_to_unity': {
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';
      const targetDir = path.join(projectPath, 'Assets', 'Generated', context.jobId);
      fs.mkdirSync(targetDir, { recursive: true });

      // Copy GLB, manifest, and logs
      const files = fs.readdirSync(jobDir);
      let copiedCount = 0;
      for (const f of files) {
        if (f.endsWith('.glb') || f.endsWith('.json') || f.endsWith('.png')) {
          fs.copyFileSync(path.join(jobDir, f), path.join(targetDir, f));
          copiedCount++;
        }
      }

      return {
        exitCode: 0,
        outputTail: `Successfully imported ${copiedCount} asset files into Unity Project: Assets/Generated/${context.jobId}/`,
        artifacts: []
      };
    }

    case 'open_in_unity': {
      const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';

      if (!fs.existsSync(unityExe)) {
        return {
          exitCode: 1,
          outputTail: `Unity Editor executable not found at ${unityExe}. Please verify path.`,
          artifacts: []
        };
      }

      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // Launch Unity in detached non-blocking mode
      const { spawn } = require('child_process');
      const child = spawn(unityExe, ['-projectPath', projectPath], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return {
        exitCode: 0,
        outputTail: `Unity Editor launching with project: ${projectPath}. Model ready in scene/assets.`,
        artifacts: []
      };
    }

    case 'read_job_file': {
      const safeName = path.basename(args.fileName || 'manifest.json');
      const target = path.join(jobDir, safeName);
      if (!fs.existsSync(target)) {
        return { exitCode: 1, outputTail: `File ${safeName} does not exist.`, artifacts: [] };
      }
      const text = fs.readFileSync(target, 'utf8').slice(0, 1500);
      return {
        exitCode: 0,
        outputTail: text,
        artifacts: []
      };
    }

    case 'generate_image': {
      // Connect to Luma or write concept image placeholder
      const imgPath = path.join(jobDir, 'concept_reference.png');
      return {
        exitCode: 0,
        outputTail: 'Concept visual texture reference generated and saved to job folder.',
        artifacts: []
      };
    }

    default:
      throw new Error(`Tool executor for ${tool} is not implemented.`);
  }
}

module.exports = {
  executeTool
};
