# Aether3D — End-to-End AI-to-CLI-to-Unity 3D Generation Pipeline

> Comprehensive Engineering Architecture, Workflow Specification & Implementation Roadmap for Natural Language Prompt-Driven 3D Asset Creation via Headless Unity Engine CLI Automation.

---

## 1. Executive Summary & Vision

This specification details how **Aether3D Workspace** will enable administrators to enter a natural language prompt (e.g., *"Create a sci-fi recon drone with twin VTOL thrusters, metallic PBR textures, and LOD levels"*), automatically compile the spatial design intent into structured procedural parameters using the Gemini Spatial AI engine, execute a background command-line interface (CLI) process invoking **Unity Engine in headless batchmode**, procedurally generate the 3D model with C# Editor scripts, export optimized `.GLB` / `.FBX` assets, and stream the resulting interactive 3D model directly back into the Workspace viewport.

---

## 2. High-Level Architecture Topology

```
+---------------------------------------------------------------------------------+
|                         AETHER3D CLIENT WORKSPACE                               |
|                                                                                 |
|  [ Prompt Input ]  -->  [ AI Engine Selector ]  -->  [ Live Status & Progress ] |
|         ^                                                    |                  |
|         |                                                    v                  |
|  [ WebGL / Three.js 3D Viewport ] <--- [.GLB Model] <--- [ Completed Event ]    |
+---------------------------------------------------------------------------------+
                                      |
                           HTTPS REST / WebSocket
                                      v
+---------------------------------------------------------------------------------+
|                       NODE.JS / EXPRESS BACKEND SERVER                          |
|                                                                                 |
|  POST /api/unity/generate                                                       |
|  +-- 1. JWT Authentication & Admin RBAC Check                                  |
|  +-- 2. Gemini Spatial Prompt Compiler (Produces Strict Build Manifest JSON)    |
|  +-- 3. Job Dispatcher & Process Worker (child_process.spawn)                   |
|  +-- 4. Polling & Status Telemetry (/api/unity/jobs/:jobId)                     |
+---------------------------------------------------------------------------------+
                                      |
                     Sanitized CLI Process Invocation
                                      v
+---------------------------------------------------------------------------------+
|                       HEADLESS UNITY ENGINE WORKER                              |
|                                                                                 |
|  Unity.exe -batchmode -nographics -projectPath ... -executeMethod ...           |
|  +-- 1. Loads Build Manifest JSON                                               |
|  +-- 2. Aether3DModelBuilder.cs Executes Procedural Geometry Generation         |
|  +-- 3. PBR Material & Texture Assignment                                       |
|  +-- 4. GLTF/GLB Exporter with Draco Mesh Compression                           |
|  +-- 5. Writes Model to Backend Uploads Directory & Exits (code 0)              |
+---------------------------------------------------------------------------------+
                                      |
                              Asset Registration
                                      v
+---------------------------------------------------------------------------------+
|                             MONGODB & ASSET VAULT                               |
|                                                                                 |
|  Models Collection: { title, assetKey, polyCount, fileFormat, downloadUrl }     |
|  Static Server: /uploads/generated_models/:jobId/model.glb                      |
+---------------------------------------------------------------------------------+
```

---

## 3. Detailed Step-by-Step Generation Workflow

### Step 1: Prompt Submission (Workspace UI)
The administrator enters a 3D model prompt in `Workspace.html` and selects generation parameters (e.g., target polygon budget, style preset, export format). Clicking **Generate** sends a `POST /api/unity/generate` request containing:
```json
{
  "prompt": "Futuristic transport rover with 6 off-road wheels and solar roof array",
  "category": "Vehicles",
  "polyBudget": "medium",
  "exportFormat": "glb",
  "targetPlatform": "webxr"
}
```

### Step 2: Request Validation & Job Initialization
1. Express authenticates the JWT bearer token and verifies the user has `role: 'admin'`.
2. A generation record is created in MongoDB with initial status: `QUEUED`.
3. Unique Job ID assigned: `JOB-<TIMESTAMP>-<RANDOM_HEX>`.
4. Job directory prepared: `Backend/uploads/unity_jobs/<jobId>/`.

### Step 3: AI Spatial Intent Parsing (Gemini Spatial Compiler)
The backend routes the prompt through the Google Gemini API with a specialized system instruction enforcing a strict JSON procedural schema.
The AI compiles the free-form text into a structured build manifest:
```json
{
  "assetName": "FuturisticTransportRover",
  "rootEntity": {
    "name": "Rover_Chassis",
    "transform": { "position": [0, 0.5, 0], "rotation": [0, 0, 0], "scale": [2.5, 0.8, 4.0] },
    "primitive": "RoundedBox",
    "material": { "color": "#0284c7", "metallic": 0.85, "roughness": 0.25 }
  },
  "children": [
    {
      "name": "Solar_Array",
      "transform": { "position": [0, 1.0, 0], "rotation": [0, 0, 0], "scale": [2.2, 0.05, 3.2] },
      "primitive": "Box",
      "material": { "color": "#0f172a", "metallic": 0.9, "roughness": 0.1 }
    },
    {
      "name": "Wheel_Front_Left",
      "transform": { "position": [-1.4, 0.4, 1.4], "rotation": [0, 0, 90], "scale": [0.8, 0.4, 0.8] },
      "primitive": "Cylinder",
      "material": { "color": "#1e293b", "metallic": 0.1, "roughness": 0.8 }
    }
  ],
  "export": {
    "format": "glb",
    "dracoCompression": true
  }
}
```
The manifest is saved to `Backend/uploads/unity_jobs/<jobId>/manifest.json`.

### Step 4: Backend CLI Command Construction & Execution
The backend constructs the headless Unity execution command using array-based arguments (preventing command injection):
```bash
"C:\Program Files\Unity\Hub\Editor\2022.3.x\Editor\Unity.exe" \
  -batchmode \
  -nographics \
  -projectPath "C:\MajorApp\Unity3D_Project" \
  -executeMethod "Aether3D.ModelBuilder.ExecuteBuild" \
  -manifest "C:\MajorApp\Backend\uploads\unity_jobs\<jobId>\manifest.json" \
  -outputDir "C:\MajorApp\Backend\uploads\unity_jobs\<jobId>" \
  -logFile "C:\MajorApp\Backend\uploads\unity_jobs\<jobId>\unity_build.log" \
  -quit
```

### Step 5: Procedural Mesh & Shader Generation in Unity
1. Unity starts up in headless batchmode without opening any window or GUI.
2. The custom C# Editor script `Aether3DModelBuilder.cs` reads the manifest file.
3. Unity's procedural mesh API (`MeshFilter`, `MeshRenderer`, `ProBuilder` / custom vertex generation) creates the geometry hierarchy.
4. PBR Universal Render Pipeline (URP) or Standard shaders are applied with metallic/roughness values.
5. Unity exports the finished hierarchy using UnityGLTF / Draco exporter as `<jobId>_model.glb`.
6. Unity exits cleanly with exit code `0`.

### Step 6: Registration & Real-Time Delivery
1. The backend detects process completion (exit code 0).
2. The generated `.glb` file is verified and registered in the database.
3. The job status transitions to `COMPLETED` with download and streaming URLs:
   `/api/unity/models/<jobId>.glb`.
4. The Workspace frontend receives the completion payload, renders the model immediately in the Three.js canvas, and enables one-click download.

---

## 4. Unity C# Automation Editor Script (`Aether3DModelBuilder.cs`)

Here is the exact structure of the Unity Editor script that runs in batchmode:

```csharp
using UnityEngine;
using UnityEditor;
using System.IO;
using System;

namespace Aether3D
{
    public class ModelBuilder
    {
        public static void ExecuteBuild()
        {
            string[] args = Environment.GetCommandLineArgs();
            string manifestPath = GetArgValue(args, "-manifest");
            string outputDir = GetArgValue(args, "-outputDir");

            if (string.IsNullOrEmpty(manifestPath) || !File.Exists(manifestPath))
            {
                Debug.LogError("[Aether3D] Missing or invalid manifest file.");
                EditorApplication.Exit(1);
                return;
            }

            try
            {
                string json = File.ReadAllText(manifestPath);
                ManifestData data = JsonUtility.FromJson<ManifestData>(json);

                // 1. Create root GameObject
                GameObject root = new GameObject(data.assetName);

                // 2. Build procedural components & primitives
                BuildEntity(root.transform, data.rootEntity);
                foreach (var child in data.children)
                {
                    GameObject childGo = new GameObject(child.name);
                    childGo.transform.SetParent(root.transform);
                    BuildEntity(childGo.transform, child);
                }

                // 3. Export to GLTF / GLB
                string outputPath = Path.Combine(outputDir, data.assetName + ".glb");
                ExportToGLB(root, outputPath);

                Debug.Log("[Aether3D] Model generated successfully: " + outputPath);
                EditorApplication.Exit(0);
            }
            catch (Exception ex)
            {
                Debug.LogError("[Aether3D] Generation failed: " + ex.Message);
                EditorApplication.Exit(2);
            }
        }

        private static void BuildEntity(Transform parent, EntitySpec spec) { ... }
        private static void ExportToGLB(GameObject root, string path) { ... }
        private static string GetArgValue(string[] args, string flag) { ... }
    }
}
```

---

## 5. Security & Isolation Controls

| Security Area | Threat | Mitigation Control |
| :--- | :--- | :--- |
| **Command Injection** | Attacker injects shell characters in prompts | Manifest is serialized to a JSON file; Unity executable arguments are passed as discrete array elements (`spawn(exe, args[])`). No shell evaluation (`exec`). |
| **Denial of Service (DoS)** | Complex prompt causing infinite loop in Unity | 120-second timeout enforced by Node.js child process watcher (`SIGKILL` sent if process hangs). |
| **Filesystem Safety** | Unity overwriting project or system files | Unity output paths are constrained strictly within `Backend/uploads/unity_jobs/<jobId>/`. |
| **RBAC Authorization** | Unauthorized customers triggering GPU jobs | Protected by `authenticate` and `requireRole('admin')` middleware. |
| **Disk Exhaustion** | Large model exports filling server disk | Automated 24-hour cleanup cron deletes intermediate log and OBJ/FBX files, keeping only the final compressed `.glb`. |

---

## 6. Implementation Roadmap

```
[ Phase 1: Core Unity Headless Engine ]
  • Set up Unity project with Aether3DModelBuilder.cs editor automation script.
  • Test batchmode generation and GLTF/GLB export from terminal.

[ Phase 2: Express Backend Pipeline ]
  • Create Modules/Unity (unity.controller.js, unity.routes.js, unity.service.js).
  • Implement child_process spawn runner with timeout and log tracking.
  • Add MongoDB Job tracking model.

[ Phase 3: AI Spatial Semantic Compiler ]
  • Integrate Gemini with structured JSON Output schema for 3D manifests.
  • Connect Workspace Prompt textarea to POST /api/unity/generate.

[ Phase 4: Frontend Workspace Integration ]
  • Add real-time generation progress bar in Workspace.html.
  • Automatically load generated .glb into Three.js canvas upon completion.
  • Enable instant "Download .GLB" and "Publish to Catalog" actions.
```

---

## 7. Artifacts Summary

This workflow specification is available in two formats within the `Readme/` directory:
- **Microsoft Word Document**: [UNITY_AI_PIPELINE_ARCHITECTURE.docx](file:///C:/Users/Niraj%20Nagaonkar/OneDrive/Desktop/Major/Readme/UNITY_AI_PIPELINE_ARCHITECTURE.docx)
- **Markdown Document**: [UNITY_AI_PIPELINE_ARCHITECTURE.md](file:///C:/Users/Niraj%20Nagaonkar/OneDrive/Desktop/Major/Readme/UNITY_AI_PIPELINE_ARCHITECTURE.md)
