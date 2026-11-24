const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', '..', '..', 'Front-end', 'Admin');

function replaceColors(content) {
  return content
    // Hex colors
    .replace(/#9333ea/gi, '#0284c7')
    .replace(/#7e22ce/gi, '#0369a1')
    .replace(/#6d28d9/gi, '#075985')
    .replace(/#8b5cf6/gi, '#0ea5e9')
    .replace(/#a855f7/gi, '#0ea5e9')
    .replace(/#c084fc/gi, '#38bdf8')
    .replace(/#d8b4fe/gi, '#7dd3fc')
    .replace(/#e9d5ff/gi, '#bae6fd')
    .replace(/#f3e8ff/gi, '#e0f2fe')
    .replace(/#faf5ff/gi, '#f0f9ff')
    // RGB & RGBA
    .replace(/rgba?\(\s*147\s*,\s*51\s*,\s*234(\s*,\s*[\d\.]+)?\s*\)/gi, (m, a) => a !== undefined ? `rgba(2, 132, 199${a})` : 'rgb(2, 132, 199)')
    .replace(/rgba?\(\s*168\s*,\s*85\s*,\s*247(\s*,\s*[\d\.]+)?\s*\)/gi, (m, a) => a !== undefined ? `rgba(14, 165, 233${a})` : 'rgb(14, 165, 233)')
    .replace(/rgba?\(\s*192\s*,\s*132\s*,\s*252(\s*,\s*[\d\.]+)?\s*\)/gi, (m, a) => a !== undefined ? `rgba(56, 189, 248${a})` : 'rgb(56, 189, 248)')
    .replace(/rgba?\(\s*126\s*,\s*34\s*,\s*206(\s*,\s*[\d\.]+)?\s*\)/gi, (m, a) => a !== undefined ? `rgba(3, 105, 161${a})` : 'rgb(3, 105, 161)');
}

// 1. Process Admin.css
const adminCssPath = path.join(baseDir, 'Admin.css');
if (fs.existsSync(adminCssPath)) {
  let css = fs.readFileSync(adminCssPath, 'utf8');
  css = replaceColors(css);
  fs.writeFileSync(adminCssPath, css, 'utf8');
  console.log('✅ Admin.css updated to Sky Blue & White theme');
}

// 2. Process Workspace.css
const workspaceCssPath = path.join(baseDir, 'Workspace.css');
if (fs.existsSync(workspaceCssPath)) {
  let css = fs.readFileSync(workspaceCssPath, 'utf8');
  css = replaceColors(css);
  fs.writeFileSync(workspaceCssPath, css, 'utf8');
  console.log('✅ Workspace.css updated to Sky Blue & White theme');
}

// 3. Process Workspace.html (inline styles)
const workspaceHtmlPath = path.join(baseDir, 'Workspace.html');
if (fs.existsSync(workspaceHtmlPath)) {
  let html = fs.readFileSync(workspaceHtmlPath, 'utf8');
  html = replaceColors(html);
  fs.writeFileSync(workspaceHtmlPath, html, 'utf8');
  console.log('✅ Workspace.html inline color styles updated');
}

// 4. Also update Admin.html if any
const adminHtmlPath = path.join(baseDir, 'Admin.html');
if (fs.existsSync(adminHtmlPath)) {
  let html = fs.readFileSync(adminHtmlPath, 'utf8');
  html = replaceColors(html);
  fs.writeFileSync(adminHtmlPath, html, 'utf8');
  console.log('✅ Admin.html updated');
}
