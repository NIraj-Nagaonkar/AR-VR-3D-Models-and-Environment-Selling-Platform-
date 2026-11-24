const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('Syncing Front-end...');
copyDir('C:/MajorApp/Front-end', 'C:/Users/Niraj Nagaonkar/OneDrive/Desktop/Major/Front-end');

console.log('Syncing Backend/src...');
copyDir('C:/MajorApp/Backend/src', 'C:/Users/Niraj Nagaonkar/OneDrive/Desktop/Major/Backend/src');

console.log('Syncing READMEs...');
fs.copyFileSync('C:/MajorApp/README.md', 'C:/Users/Niraj Nagaonkar/OneDrive/Desktop/Major/README.md');
copyDir('C:/MajorApp/Readme', 'C:/Users/Niraj Nagaonkar/OneDrive/Desktop/Major/Readme');

const gitRoot = 'C:/Users/Niraj Nagaonkar/OneDrive/Desktop/Major';
const lock = path.join(gitRoot, '.git', 'index.lock');
if (fs.existsSync(lock)) fs.unlinkSync(lock);

console.log('Git add...');
execSync('git add -A', { cwd: gitRoot, stdio: 'inherit' });

console.log('Git commit...');
execSync('git commit -m "chore: replace emojis with professional icons and standard text"', { cwd: gitRoot, stdio: 'inherit' });

console.log('Git push...');
execSync('git push origin main', { cwd: gitRoot, stdio: 'inherit' });
console.log('Done.');
