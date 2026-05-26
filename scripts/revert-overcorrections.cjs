const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const files = [
  'src/components/Dashboard.tsx',
  'src/components/LoginPage.tsx',
  'src/App.tsx',
];

// Files that might have focus:ring-*-500/50 patterns
const allFiles = [
  'src/App.tsx',
  'src/components/AuthModal.tsx',
  'src/components/Dashboard.tsx',
  'src/components/DietPlan.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/FoodLog.tsx',
  'src/components/GlucoseChart.tsx',
  'src/components/GlucoseForm.tsx',
  'src/components/GlucoseLog.tsx',
  'src/components/LoginPage.tsx',
  'src/components/MealPlanner.tsx',
  'src/components/Medications.tsx',
  'src/components/NotificationsPage.tsx',
  'src/components/Reminders.tsx',
  'src/components/SettingsPage.tsx',
  'src/components/StatsCard.tsx',
  'src/components/UserProfile.tsx',
  'src/components/ConfirmModal.tsx',
];

let updated = 0;

// Fix 1: bg-white/10 → became bg-gray-800/40 → should be bg-white/5
for (const file of ['src/components/Dashboard.tsx']) {
  const fp = path.join(root, file);
  let content = fs.readFileSync(fp, 'utf-8');
  const orig = content;
  
  // These specific areas were bg-white/10 originally - change to bg-white/5
  content = content.replace(/bg-gray-800\/40 backdrop-blur-sm/g, 'bg-white/5 backdrop-blur-sm');
  
  if (content !== orig) {
    fs.writeFileSync(fp, content);
    console.log(`✓ Fixed bg overlays in ${file}`);
    updated++;
  }
}

// Fix 2: bg-white/15 → became bg-gray-800/50 → should be bg-white/5
{
  const fp = path.join(root, 'src/components/Dashboard.tsx');
  let content = fs.readFileSync(fp, 'utf-8');
  const orig = content;
  content = content.replace(/bg-gray-800\/50 backdrop-blur-sm/g, 'bg-white/5 backdrop-blur-sm');
  if (content !== orig) {
    fs.writeFileSync(fp, content);
    console.log('✓ Fixed bg-white/15 overlay in Dashboard.tsx');
    updated++;
  }
}

// Fix 3: bg-white/20 in LoginPage → became bg-gray-800/60 → should be bg-white/10
{
  const fp = path.join(root, 'src/components/LoginPage.tsx');
  let content = fs.readFileSync(fp, 'utf-8');
  const orig = content;
  content = content.replace(/bg-gray-800\/60 backdrop-blur-md/g, 'bg-white/10 backdrop-blur-md');
  if (content !== orig) {
    fs.writeFileSync(fp, content);
    console.log('✓ Fixed bg overlay in LoginPage.tsx');
    updated++;
  }
}

// Fix 4: focus:ring-*-500/50 → should be focus:ring-*-500 (no opacity)
for (const file of allFiles) {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf-8');
  const orig = content;
  
  content = content.replace(/focus:ring-blue-500\/50\b/g, 'focus:ring-blue-500');
  content = content.replace(/focus:ring-orange-500\/50\b/g, 'focus:ring-orange-500');
  content = content.replace(/focus:ring-emerald-500\/50\b/g, 'focus:ring-emerald-500');
  content = content.replace(/focus:ring-red-500\/50\b/g, 'focus:ring-red-500');
  content = content.replace(/focus:ring-purple-500\/50\b/g, 'focus:ring-purple-500');
  
  if (content !== orig) {
    fs.writeFileSync(fp, content);
    console.log(`✓ Fixed focus rings in ${file}`);
    updated++;
  }
}

console.log(`\n✅ ${updated} files updated.`);
