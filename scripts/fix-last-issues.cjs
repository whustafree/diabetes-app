const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// Fix StatsCard.tsx: bg-gray-800 → bg-gray-700 for visible card bg
const scPath = path.join(root, 'src/components/StatsCard.tsx');
let sc = fs.readFileSync(scPath, 'utf-8');
const scOrig = sc;

// bg-gray-800 → bg-gray-700 (better contrast on slate-900)
sc = sc.replace(/bg:\s*'bg-gray-800'/g, "bg: 'bg-gray-700'");
// Remove duplicate text-gray-400
sc = sc.replace(/text-gray-400 text-gray-400/g, 'text-gray-400');

if (sc !== scOrig) {
  fs.writeFileSync(scPath, sc);
  console.log('✓ StatsCard.tsx fixed');
} else {
  console.log('  StatsCard.tsx: no changes');
}

// Fix Dashboard.tsx: bg-gray-300 bg-gray-600 → bg-gray-600
const dashPath = path.join(root, 'src/components/Dashboard.tsx');
let dash = fs.readFileSync(dashPath, 'utf-8');
const dashOrig = dash;
dash = dash.replace(/bg-gray-300 bg-gray-600/g, 'bg-gray-600');
if (dash !== dashOrig) {
  fs.writeFileSync(dashPath, dash);
  console.log('✓ Dashboard.tsx fixed (bg-gray-300 → removed)');
} else {
  console.log('  Dashboard.tsx: no changes');
}

// Fix SettingsPage.tsx: bg-gray-300 bg-gray-600 → bg-gray-600
const setPath = path.join(root, 'src/components/SettingsPage.tsx');
let set = fs.readFileSync(setPath, 'utf-8');
const setOrig = set;
set = set.replace(/bg-gray-300 bg-gray-600/g, 'bg-gray-600');
if (set !== setOrig) {
  fs.writeFileSync(setPath, set);
  console.log('✓ SettingsPage.tsx fixed (bg-gray-300 → removed)');
} else {
  console.log('  SettingsPage.tsx: no changes');
}

console.log('\n✅ Done');
