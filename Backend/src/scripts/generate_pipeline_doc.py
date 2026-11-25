import os
import zipfile

def create_docx(filename, title, sections):
    # XML building blocks
    def escape_xml(s):
        return (str(s)
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;'))

    body_xml = []
    
    # Title
    body_xml.append(f'''
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="300" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
          <w:b/>
          <w:color w:val="0284C7"/>
          <w:sz w:val="48"/>
        </w:rPr>
        <w:t>{escape_xml(title)}</w:t>
      </w:r>
    </w:p>
    ''')

    # Subtitle
    body_xml.append(f'''
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
          <w:color w:val="64748B"/>
          <w:sz w:val="24"/>
          <w:i/>
        </w:rPr>
        <w:t>End-to-End AI-to-CLI-to-Unity 3D Generation Architecture &amp; Workflow Specification</w:t>
      </w:r>
    </w:p>
    <w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>
    ''')

    for sec in sections:
        sec_type = sec.get('type')
        if sec_type == 'h1':
            body_xml.append(f'''
            <w:p>
              <w:pPr>
                <w:spacing w:before="360" w:after="120"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                  <w:b/>
                  <w:color w:val="0369A1"/>
                  <w:sz w:val="32"/>
                </w:rPr>
                <w:t>{escape_xml(sec['text'])}</w:t>
              </w:r>
            </w:p>
            ''')
        elif sec_type == 'h2':
            body_xml.append(f'''
            <w:p>
              <w:pPr>
                <w:spacing w:before="240" w:after="100"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                  <w:b/>
                  <w:color w:val="0F172A"/>
                  <w:sz w:val="26"/>
                </w:rPr>
                <w:t>{escape_xml(sec['text'])}</w:t>
              </w:r>
            </w:p>
            ''')
        elif sec_type == 'p':
            body_xml.append(f'''
            <w:p>
              <w:pPr>
                <w:spacing w:before="60" w:after="100" w:line="276" w:lineRule="auto"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                  <w:color w:val="334155"/>
                  <w:sz w:val="22"/>
                </w:rPr>
                <w:t>{escape_xml(sec['text'])}</w:t>
              </w:r>
            </w:p>
            ''')
        elif sec_type == 'bullet':
            body_xml.append(f'''
            <w:p>
              <w:pPr>
                <w:ind w:left="400"/>
                <w:spacing w:before="40" w:after="60"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                  <w:b/>
                  <w:color w:val="0284C7"/>
                  <w:sz w:val="22"/>
                </w:rPr>
                <w:t>• </w:t>
              </w:r>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                  <w:color w:val="1E293B"/>
                  <w:sz w:val="22"/>
                </w:rPr>
                <w:t>{escape_xml(sec['text'])}</w:t>
              </w:r>
            </w:p>
            ''')
        elif sec_type == 'table':
            rows_xml = []
            for row_idx, row in enumerate(sec['rows']):
                cells_xml = []
                is_header = (row_idx == 0)
                bg_color = 'E0F2FE' if is_header else ('F8FAFC' if row_idx % 2 == 1 else 'FFFFFF')
                for cell in row:
                    cells_xml.append(f'''
                    <w:tc>
                      <w:tcPr>
                        <w:tcW w:w="3000" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/>
                        <w:tcMar>
                          <w:top w:w="120" w:type="dxa"/>
                          <w:bottom w:w="120" w:type="dxa"/>
                          <w:left w:w="160" w:type="dxa"/>
                          <w:right w:w="160" w:type="dxa"/>
                        </w:tcMar>
                      </w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="0"/></w:pPr>
                        <w:r>
                          <w:rPr>
                            <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
                            {'<w:b/>' if is_header else ''}
                            <w:color w:val="{'0369A1' if is_header else '334155'}"/>
                            <w:sz w:val="20"/>
                          </w:rPr>
                          <w:t>{escape_xml(cell)}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                    ''')
                rows_xml.append(f'<w:tr>{"".join(cells_xml)}</w:tr>')
            
            body_xml.append(f'''
            <w:tbl>
              <w:tblPr>
                <w:tblW w:w="9200" w:type="dxa"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                  <w:top w:val="single" w:sz="4" w:space="0" w:color="BAE6FD"/>
                  <w:left w:val="single" w:sz="4" w:space="0" w:color="BAE6FD"/>
                  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="BAE6FD"/>
                  <w:right w:val="single" w:sz="4" w:space="0" w:color="BAE6FD"/>
                  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                </w:tblBorders>
              </w:tblPr>
              {"".join(rows_xml)}
            </w:tbl>
            <w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>
            ''')

    doc_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_xml)}
  </w:body>
</w:document>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/document.xml', doc_xml)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    sections = [
        {"type": "h1", "text": "1. Executive Summary & Architectural Vision"},
        {"type": "p", "text": "This document specifies the end-to-end engineering architecture, CLI automation bridge, and system workflow to enable natural language prompt-driven 3D model creation within the Aether3D platform. By bridging the Aether3D Workspace frontend with a headless Unity Engine CLI execution worker, administrators can prompt complex 3D assets, procedural environments, and spatial components, have AI translate those requirements into execution manifests, execute them in a secure backend environment, and receive real-time streaming feedback and interactive WebGL/WebXR previews."},
        
        {"type": "h1", "text": "2. End-to-End System Workflow"},
        {"type": "p", "text": "The generation lifecycle operates through 5 decoupled phases designed for reliability, non-blocking execution, and process security:"},
        {"type": "bullet", "text": "Phase 1 - Workspace Prompt Input: Admin enters a descriptive spatial prompt (e.g. 'Cybernetic Drone with twin thrusters, metallic PBR textures, and LOD levels')."},
        {"type": "bullet", "text": "Phase 2 - AI Semantic Compilation: Node.js backend invokes the Google Gemini Spatial AI model with a strict JSON Schema prompt to compile geometry specifications, mesh hierarchy, procedural dimensions, materials, and C# generator parameters."},
        {"type": "bullet", "text": "Phase 3 - CLI Task Queuing & Execution: Express backend constructs a sanitized headless Unity CLI command and dispatches it to the background Unity Worker Process via Node.js child_process.spawn()."},
        {"type": "bullet", "text": "Phase 4 - Headless Unity Generation & Export: Unity launches in -batchmode -nographics, loads the Aether3D Model Builder editor script, synthesizes procedural meshes, assigns PBR shaders, and exports the final model as optimized .GLB and .FBX files."},
        {"type": "bullet", "text": "Phase 5 - Asset Delivery & Workspace Preview: The backend registers the new model in MongoDB, uploads/caches the .GLB asset, and returns the interactive model URL to the frontend Workspace for immediate 3D WebXR inspection and customer catalog listing."},

        {"type": "h1", "text": "3. Component Architecture & System Topology"},
        {"type": "table", "rows": [
            ["Layer / Component", "Technology Stack", "Role & Responsibilities"],
            ["Frontend Workspace", "Vanilla JS, Three.js, WebGL", "Admin prompt input, AI model selector, progress bar, real-time 3D canvas viewport"],
            ["API Gateway & Auth", "Express.js, JWT, Helmet", "Route guard (Admin-only), rate limiting, job dispatching (/api/unity/generate)"],
            ["AI Spatial Compiler", "Google Gemini API / Structured JSON", "Translates free-text prompts into precise 3D procedural build manifests"],
            ["CLI Execution Worker", "Node.js child_process, Task Queue", "Spawns Unity in headless batchmode, monitors exit codes, captures stderr/stdout"],
            ["Unity Engine Headless", "Unity 2022/2026 LTS (C# Editor API)", "Batchmode mesh generation, procedural geometry, FBX/GLTF export pipeline"],
            ["Storage & Registry", "MongoDB, Static Asset Vault", "Stores model metadata, polygon count, preview thumbnail, and download links"]
        ]},

        {"type": "h1", "text": "4. Unity CLI Headless Command Shape & Arguments"},
        {"type": "p", "text": "To run Unity without a GUI display on the server, the backend executes Unity through an isolated command line invocation:"},
        {"type": "bullet", "text": "Unity.exe -batchmode: Disables GUI rendering and window popups, allowing background execution on local or cloud servers."},
        {"type": "bullet", "text": "-nographics: Disables graphics device initialization to enable fast CPU-based procedural synthesis without requiring a dedicated display monitor."},
        {"type": "bullet", "text": "-projectPath <PATH>: Targets the headless Aether3D Unity project directory containing the editor compilation scripts."},
        {"type": "bullet", "text": "-executeMethod Aether3D.ModelBuilder.GenerateAsset: Directs Unity to run the automated C# asset generation pipeline on startup."},
        {"type": "bullet", "text": "-manifestPath <PATH_TO_JSON>: Passes the AI-compiled build parameters file specifying scale, vertices, material colors, and export format."},
        {"type": "bullet", "text": "-logFile <PATH_TO_LOG>: Records all Unity compilation logs and compiler warnings for telemetry and diagnostics."},
        {"type": "bullet", "text": "-quit: Closes the Unity process immediately after asset compilation and export finish."},

        {"type": "h1", "text": "5. Data Manifest & Job State Machine"},
        {"type": "p", "text": "Every generation job transitions through a well-defined lifecycle managed by the backend:"},
        {"type": "table", "rows": [
            ["Job State", "Trigger", "Description"],
            ["QUEUED", "POST /api/unity/generate", "Job created in database, assigned unique UUID, awaiting execution slot"],
            ["PARSING_PROMPT", "Gemini API Call", "Translating natural language prompt into procedural geometry manifest"],
            ["EXECUTING_CLI", "child_process.spawn()", "Launching headless Unity editor in batchmode with build arguments"],
            ["BUILDING_MESH", "Unity C# Execution", "Synthesizing procedural vertices, normals, UVs, and PBR materials"],
            ["EXPORTING_GLB", "GLTF Exporter", "Compacting asset into Draco-compressed .GLB for instant web delivery"],
            ["COMPLETED", "Process Exit 0", "Model registered in MongoDB, preview ready in Workspace 3D viewer"],
            ["FAILED", "Timeout / Exit > 0", "Error logged, detailed diagnostic feedback returned to Workspace"]
        ]},

        {"type": "h1", "text": "6. Security & Sandboxing Architecture"},
        {"type": "p", "text": "Because CLI commands interact with the underlying host system, strict security controls are enforced:"},
        {"type": "bullet", "text": "No Direct Shell String Injection: Commands are spawned with array-based arguments (spawn(binary, [args])) rather than raw string shell evaluations (exec), eliminating command chaining attacks."},
        {"type": "bullet", "text": "Strict RBAC Verification: Only authenticated administrators with verified JWT Bearer tokens can access the generation endpoint."},
        {"type": "bullet", "text": "Process Timeout Protection: All Unity CLI instances are assigned a strict execution timeout (default: 120 seconds). Any hung process is terminated automatically."},
        {"type": "bullet", "text": "Filesystem Isolation: Build manifests and output files are written exclusively to isolated workspace directories (Backend/uploads/unity_jobs/<jobId>/)."},

        {"type": "h1", "text": "7. Implementation Roadmap & Milestones"},
        {"type": "table", "rows": [
            ["Milestone", "Scope & Deliverables", "Target Outcome"],
            ["Phase 1", "Unity C# Editor Script (Aether3DModelBuilder.cs) & GLTF Exporter", "Headless batchmode model generation verified via command line"],
            ["Phase 2", "Express Backend Module (Modules/Unity) & Process Runner", "REST endpoints for job submission, status polling, and cancelation"],
            ["Phase 3", "AI Prompt Compiler (Gemini Structured Outputs)", "Seamless translation from prompt text to Unity procedural parameters"],
            ["Phase 4", "Workspace Frontend Integration (Live Viewport & Status Bar)", "Real-time generation progress, interactive 3D WebXR preview, and export"]
        ]}
    ]

    create_docx('C:/MajorApp/Readme/UNITY_AI_PIPELINE_ARCHITECTURE.docx', 'Aether3D — AI-to-CLI-to-Unity Pipeline Architecture', sections)
