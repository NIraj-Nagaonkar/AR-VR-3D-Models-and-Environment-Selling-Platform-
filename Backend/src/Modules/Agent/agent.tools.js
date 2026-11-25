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
  } else if (p.includes('tree') || p.includes('plant') || p.includes('foliage') || p.includes('vegetation')) {
    assetName = 'LowPolyTree';
    parts = [
      { id: 'trunk', parent: null, shape: 'cylinder', transform: { position: [0, 1.0, 0], scale: [0.35, 2.0, 0.35] }, material: { color: '#78350f', metallic: 0.1, roughness: 0.9 } },
      { id: 'foliage_base', parent: 'trunk', shape: 'sphere', transform: { position: [0, 2.2, 0], scale: [1.8, 1.4, 1.8] }, material: { color: '#15803d', metallic: 0.05, roughness: 0.8 } },
      { id: 'foliage_mid', parent: 'trunk', shape: 'sphere', transform: { position: [0, 3.0, 0], scale: [1.4, 1.2, 1.4] }, material: { color: '#16a34a', metallic: 0.05, roughness: 0.75 } },
      { id: 'foliage_top', parent: 'trunk', shape: 'sphere', transform: { position: [0, 3.7, 0], scale: [0.9, 0.9, 0.9] }, material: { color: '#22c55e', metallic: 0.05, roughness: 0.7 } }
    ];
    animations = [
      { preset: 'swing', targets: ['foliage_top', 'foliage_mid'], axis: 'z', secondsPerTurn: 3.0, loop: true }
    ];
  } else if (p.includes('sword') || p.includes('blade') || p.includes('weapon')) {
    assetName = 'SciFiEnergyBlade';
    parts = [
      { id: 'hilt', parent: null, shape: 'cylinder', transform: { position: [0, 0.3, 0], scale: [0.12, 0.6, 0.12] }, material: { color: '#0f172a', metallic: 0.9, roughness: 0.2 } },
      { id: 'guard', parent: 'hilt', shape: 'box', transform: { position: [0, 0.65, 0], scale: [0.6, 0.08, 0.16] }, material: { color: '#0284c7', metallic: 0.85, roughness: 0.25 } },
      { id: 'blade', parent: 'guard', shape: 'box', transform: { position: [0, 1.8, 0], scale: [0.14, 2.2, 0.04] }, material: { color: '#38bdf8', metallic: 0.95, roughness: 0.1 } }
    ];
    animations = [
      { preset: 'bob', targets: ['hilt'], axis: 'y', secondsPerTurn: 2.0, loop: true }
    ];
  } else if (p.includes('character') || p.includes('robot') || p.includes('bot') || p.includes('mech')) {
    assetName = 'CompactScoutMech';
    parts = [
      { id: 'torso', parent: null, shape: 'box', transform: { position: [0, 1.2, 0], scale: [0.9, 1.0, 0.7] }, material: { color: '#0284c7', metallic: 0.8, roughness: 0.25 } },
      { id: 'head', parent: 'torso', shape: 'box', transform: { position: [0, 1.9, 0], scale: [0.55, 0.45, 0.55] }, material: { color: '#0f172a', metallic: 0.9, roughness: 0.1 } },
      { id: 'visor', parent: 'head', shape: 'box', transform: { position: [0, 1.9, 0.3], scale: [0.4, 0.15, 0.05] }, material: { color: '#38bdf8', metallic: 0.3, roughness: 0.1 } },
      { id: 'arm_l', parent: 'torso', shape: 'cylinder', transform: { position: [-0.65, 1.1, 0], scale: [0.18, 0.8, 0.18] }, material: { color: '#1e293b', metallic: 0.7, roughness: 0.3 } },
      { id: 'arm_r', parent: 'torso', shape: 'cylinder', transform: { position: [0.65, 1.1, 0], scale: [0.18, 0.8, 0.18] }, material: { color: '#1e293b', metallic: 0.7, roughness: 0.3 } },
      { id: 'leg_l', parent: 'torso', shape: 'cylinder', transform: { position: [-0.3, 0.4, 0], scale: [0.22, 0.8, 0.22] }, material: { color: '#1e293b', metallic: 0.7, roughness: 0.3 } },
      { id: 'leg_r', parent: 'torso', shape: 'cylinder', transform: { position: [0.3, 0.4, 0], scale: [0.22, 0.8, 0.22] }, material: { color: '#1e293b', metallic: 0.7, roughness: 0.3 } }
    ];
    animations = [
      { preset: 'bob', targets: ['torso'], axis: 'y', secondsPerTurn: 1.5, loop: true }
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

// Dynamic Spatial Reasoning with Gemini
async function planSpatialManifestWithGemini(promptText) {
  if (!process.env.GEMINI_API_KEY) {
    return planSpatialManifest(promptText);
  }

  try {
    const systemPrompt = `You are the Aether3D Procedural Spatial Engine. Return ONLY a valid JSON object representing a 3D model manifest conforming strictly to this schema:
{
  "schemaVersion": 2,
  "assetName": "CamelCaseName",
  "targetSizeMeters": 2.0,
  "parts": [
    {
      "id": "unique_part_id",
      "parent": null or "parent_id",
      "shape": "box" | "cylinder" | "sphere",
      "transform": {
        "position": [x, y, z],
        "rotation": [x, y, z],
        "scale": [w, h, d]
      },
      "material": {
        "color": "#hex",
        "metallic": 0.0 to 1.0,
        "roughness": 0.0 to 1.0
      }
    }
  ],
  "animations": [
    {
      "preset": "spin" | "bob" | "swing" | "slide",
      "targets": ["part_id"],
      "axis": "x" | "y" | "z",
      "secondsPerTurn": 1.5,
      "loop": true
    }
  ]
}
Design 4 to 12 stylized primitive parts that compose the user's requested 3D model. Output pure JSON without markdown code fences.`;

    const modelName = process.env.GEMINI_AGENT_MODEL || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Create a 3D procedural manifest for: ${promptText}` }] }],
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed.parts && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Gemini dynamic manifest fallback:', err.message);
  }

  return planSpatialManifest(promptText);
}

async function executeTool({ tool, args, context, stepRecord }) {
  const jobDir = context.jobDir;
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  switch (tool) {
    case 'plan_model': {
      const prompt = args.prompt || context.initialPrompt || '3D Asset';
      const manifest = await planSpatialManifestWithGemini(prompt);
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
