const crypto = require('crypto');
const path = require('path');

const TOOL_CATALOGUE = {
  plan_model: {
    name: 'plan_model',
    description: 'Turn user prompt into a structured 3D spatial geometry and procedural parts manifest.',
    risk: 'LOW',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        targetSizeMeters: { type: 'number' }
      },
      required: ['prompt']
    },
    buildCommand(args, context) {
      return {
        executable: 'INTERNAL_AI_CALL',
        args: ['gemini', 'plan_model', '--prompt', args.prompt || ''],
        displayCommand: `node Backend/src/Modules/Agent/tools/planner.js --prompt "${(args.prompt || '').replace(/"/g, '\\"')}"`,
        cwd: context.jobDir,
        reason: 'Ask AI spatial compiler to design 3D asset parts list and materials'
      };
    }
  },

  generate_image: {
    name: 'generate_image',
    description: 'Create a concept visual or PBR reference image using generative AI.',
    risk: 'MEDIUM',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        aspect_ratio: { type: 'string' }
      },
      required: ['prompt']
    },
    buildCommand(args, context) {
      return {
        executable: 'INTERNAL_API_CALL',
        args: ['luma', 'generate_image', '--prompt', args.prompt || ''],
        displayCommand: `curl -X POST /api/luma/generations -d "prompt=${(args.prompt || '').substring(0, 50)}..."`,
        cwd: context.jobDir,
        reason: 'Generate concept or texture reference via Luma API'
      };
    }
  },

  build_model_unity: {
    name: 'build_model_unity',
    description: 'Execute Unity Engine in headless batchmode to build procedural geometry, assign PBR materials, and export GLB.',
    risk: 'MEDIUM',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        manifestFile: { type: 'string' }
      }
    },
    buildCommand(args, context) {
      const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';
      const manifestPath = path.join(context.jobDir, args.manifestFile || 'manifest.json');
      const logPath = path.join(context.jobDir, 'unity_build.log');

      const cmdArgs = [
        '-batchmode',
        '-nographics',
        '-projectPath', projectPath,
        '-executeMethod', 'Aether3D.ModelBuilder.ExecuteBuild',
        '-manifest', manifestPath,
        '-outputDir', context.jobDir,
        '-logFile', logPath
      ];

      return {
        executable: unityExe,
        args: cmdArgs,
        displayCommand: `Unity.exe -batchmode -nographics -projectPath "${projectPath}" -executeMethod Aether3D.ModelBuilder.ExecuteBuild -manifest "${manifestPath}" -outputDir "${context.jobDir}"`,
        cwd: context.jobDir,
        reason: 'Build 3D mesh in Unity batchmode and export Draco-compressed .GLB file'
      };
    }
  },

  animate_model_unity: {
    name: 'animate_model_unity',
    description: 'Add procedural animation preset (spin, bob, swing, slide) to target mesh components.',
    risk: 'MEDIUM',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        preset: { type: 'string', enum: ['spin', 'bob', 'swing', 'slide'] },
        targetPart: { type: 'string' },
        axis: { type: 'string' },
        speed: { type: 'number' }
      },
      required: ['preset']
    },
    buildCommand(args, context) {
      const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';

      return {
        executable: unityExe,
        args: [
          '-batchmode',
          '-nographics',
          '-projectPath', projectPath,
          '-executeMethod', 'Aether3D.AnimationBuilder.Apply',
          '-animPreset', args.preset || 'spin',
          '-jobDir', context.jobDir
        ],
        displayCommand: `Unity.exe -batchmode -nographics -projectPath "${projectPath}" -executeMethod Aether3D.AnimationBuilder.Apply -animPreset "${args.preset || 'spin'}"`,
        cwd: context.jobDir,
        reason: `Apply procedural ${args.preset || 'spin'} animation clip to 3D model in Unity`
      };
    }
  },

  import_to_unity: {
    name: 'import_to_unity',
    description: 'Copy generated .GLB model and texture artifacts into the Unity Project Assets folder.',
    risk: 'MEDIUM',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' }
      }
    },
    buildCommand(args, context) {
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';
      const targetDir = path.join(projectPath, 'Assets', 'Generated', context.jobId);
      return {
        executable: 'INTERNAL_FS_COPY',
        args: [context.jobDir, targetDir],
        displayCommand: `robocopy "${context.jobDir}" "${targetDir}" *.glb *.png *.json /E`,
        cwd: context.jobDir,
        reason: `Import generated 3D assets into Unity project Assets/Generated/${context.jobId}/`
      };
    }
  },

  open_in_unity: {
    name: 'open_in_unity',
    description: 'Open the Unity Editor GUI window to inspect and edit the generated 3D scene.',
    risk: 'MEDIUM',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {}
    },
    buildCommand(args, context) {
      const unityExe = process.env.UNITY_EDITOR_PATH || 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.6.1f1\\Editor\\Unity.exe';
      const projectPath = process.env.UNITY_PROJECT_PATH || 'C:\\Aether\\Unity3D_Project';
      return {
        executable: unityExe,
        args: ['-projectPath', projectPath],
        displayCommand: `Unity.exe -projectPath "${projectPath}"`,
        cwd: projectPath,
        reason: 'Launch Unity Editor window to inspect and interact with the generated asset'
      };
    }
  },

  read_job_file: {
    name: 'read_job_file',
    description: 'Read generated log file or manifest inside the job folder for error diagnosis.',
    risk: 'LOW',
    requiresApproval: process.env.AGENT_AUTO_ALLOW_READONLY !== 'true',
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' }
      },
      required: ['fileName']
    },
    buildCommand(args, context) {
      const safeFile = path.basename(args.fileName || 'unity_build.log');
      const fullPath = path.join(context.jobDir, safeFile);
      return {
        executable: 'INTERNAL_FS_READ',
        args: [fullPath],
        displayCommand: `type "${fullPath}"`,
        cwd: context.jobDir,
        reason: `Read diagnostic log file ${safeFile} to verify generation status`
      };
    }
  },

  run_custom_cli: {
    name: 'run_custom_cli',
    description: 'Run custom allow-listed CLI tool with elevated security verification.',
    risk: 'HIGH',
    requiresApproval: true,
    schema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        args: { type: 'array', items: { type: 'string' } }
      },
      required: ['command']
    },
    buildCommand(args, context) {
      const isEnabled = process.env.AGENT_ALLOW_CUSTOM_CLI === 'true';
      if (!isEnabled) {
        throw new Error('Custom CLI execution is disabled by security policy (AGENT_ALLOW_CUSTOM_CLI=false).');
      }
      return {
        executable: args.command,
        args: args.args || [],
        displayCommand: `${args.command} ${(args.args || []).join(' ')}`,
        cwd: context.jobDir,
        reason: `Execute custom system command ${args.command}`
      };
    }
  }
};

function calculateCommandHash(commandText, cwd) {
  return crypto.createHash('sha256').update(`${commandText.trim()}::${cwd || ''}`).digest('hex');
}

function validateToolCall(toolName, rawArgs, context) {
  const toolDef = TOOL_CATALOGUE[toolName];
  if (!toolDef) {
    throw new Error(`Tool "${toolName}" is not registered in the Aether3D Agent catalogue.`);
  }

  const args = rawArgs || {};
  const cmdObj = toolDef.buildCommand(args, context);
  const commandHash = calculateCommandHash(cmdObj.displayCommand, cmdObj.cwd);

  return {
    tool: toolName,
    args,
    reason: cmdObj.reason,
    risk: toolDef.risk,
    executable: cmdObj.executable,
    cmdArgs: cmdObj.args,
    displayCommand: cmdObj.displayCommand,
    commandHash,
    cwd: cmdObj.cwd,
    requiresApproval: toolDef.requiresApproval
  };
}

module.exports = {
  TOOL_CATALOGUE,
  validateToolCall,
  calculateCommandHash
};
