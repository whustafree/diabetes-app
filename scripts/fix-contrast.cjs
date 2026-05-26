const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = [
  'src/App.tsx',
  'src/components/AuthModal.tsx',
  'src/components/ConfirmModal.tsx',
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
];

const replacements = [
  // ─── 1. Fix semi-transparent white backgrounds ───
  // Keep subtle brightness for visual depth on dark bg
  [/bg-white\/10\b/g, 'bg-white/5'],
  [/bg-white\/15\b/g, 'bg-white/5'],
  [/bg-white\/20\b/g, 'bg-white/10'],
  [/bg-white\/60\b/g, 'bg-gray-400'],

  // ─── 2. Fix white backgrounds in className ───
  // ErrorBoundary had 'bg-white bg-gray-800' - remove bg-white
  [/(?<=^|\s)bg-white(?=\s+bg-gray-8\d{3}\b)/g, ''],
  // Remove standalone bg-white (after the above, empty string cleanup)
  [/(?<=^|\s)bg-white(?=\s|$)/g, 'bg-gray-800'],

  // ─── 3. Fix focus rings - use more visible colors on dark bg ───
  // No opacity - needs to be sharp for accessibility
  [/(?<=^|\s)focus:ring-blue-200(?=\s|$)/g, 'focus:ring-blue-500'],
  [/(?<=^|\s)focus:ring-orange-200(?=\s|$)/g, 'focus:ring-orange-500'],
  [/(?<=^|\s)focus:ring-emerald-200(?=\s|$)/g, 'focus:ring-emerald-500'],
  [/(?<=^|\s)focus:ring-red-200(?=\s|$)/g, 'focus:ring-red-500'],
  [/(?<=^|\s)focus:ring-purple-200(?=\s|$)/g, 'focus:ring-purple-500'],

  // ─── 4. Remove leftover light text classes that reduce contrast ───
  // text-gray-200 text-white → keep text-white (more contrast)
  [/(?<=^|\s)text-gray-200(?=\s+text-white\b)/g, ''],
  // text-gray-400 text-gray-300 → keep text-gray-300 (more visible)
  [/(?<=^|\s)text-gray-400(?=\s+text-gray-300\b)/g, ''],

  // ─── 5. Fix leftover light hover states ───
  [/(?<=^|\s)hover:bg-gray-200(?=\s+hover:bg-gray-6\d{3}\b)/g, ''],
  [/(?<=^|\s)hover:bg-gray-100(?=\s+hover:bg-gray-6\d{3}\b)/g, ''],
  [/(?<=^|\s)hover:bg-gray-50(?=\s+hover:bg-gray-6\d{3}\b)/g, ''],

  // ─── 6. Remove leftover light background classes ───
  [/(?<=^|\s)bg-gray-50(?=\s+bg-gray-7\d{3}\b)/g, ''],
  [/(?<=^|\s)bg-gray-100(?=\s+bg-gray-7\d{3}\b)/g, ''],
  [/(?<=^|\s)bg-gray-300(?=\s+bg-gray-6\d{3}\b)/g, ''],

  // ─── 7. Fix light toggle/switch backgrounds ───
  [/(?<=^|\s)bg-gray-200(?=\s+bg-gray-6\d{3}\b)/g, ''],

  // ─── 8. Fix duplicate classes ───
  // bg-gray-700 bg-gray-700 → bg-gray-700
  [/(?<=^|\s)bg-gray-700(?=\s+bg-gray-700\b)/g, ''],
  // border-gray-700 border-gray-600 → border-gray-600 (more visible border)
  [/(?<=^|\s)border-gray-700(?=\s+border-gray-6\d{3}\b)/g, ''],
  // duplicate shadows
  [/(?<=^|\s)shadow-\S+900\/50(?=\s+shadow-\S+900\/50\b)/g, ''],
  [/(?<=^|\s)shadow-\S+200(?=\s+shadow-\S+900\/50\b)/g, ''],
  [/(?<=^|\s)shadow-red-900\/50(?=\s+shadow-red-900\/50\b)/g, ''],
  [/(?<=^|\s)shadow-blue-900\/50(?=\s+shadow-blue-900\/50\b)/g, ''],
  [/(?<=^|\s)shadow-blue-200(?=\s+shadow-blue-900\/50\b)/g, ''],

  // ─── 9. Fix specific text contrast issues ───
  // text-gray-400 on dark bg is low contrast, upgrade to text-gray-300
  // But only when it's the last/only text class
  // text-gray-400 text-gray-500 → keep text-gray-400
  // text-gray-500 text-gray-400 → keep text-gray-400
  // Actually text-gray-400 is fine for secondary text
    
  // ─── 10. Fix StatsCard.tsx object value ───
  // bg: 'bg-white' → bg: 'bg-gray-800'
  
  // ─── 11. Remove standalone bg-gray-50 not paired with dark variant ───
  [/(?<=^|\s)bg-gray-50(?=\s|$)/g, 'bg-gray-700'],

  // ─── 12. Handle remaining text-gray-200 - always upgrade to text-white for contrast ───
  // (text-gray-200 on dark bg has poor contrast ratio)
  [/(?<=^|\s)text-gray-200(?=\s|$)/g, 'text-white'],

  // ─── 13. Handle text-gray-800 on dark bg (was for light mode) ───
  [/(?<=^|\s)text-gray-800(?=\s|$)/g, 'text-gray-200'],

  // ─── 14. Make focus border colors visible ───
  [/(?<=^|\s)focus:border-blue-400(?=\s|$)/g, 'focus:border-blue-500'],
  [/(?<=^|\s)focus:border-orange-400(?=\s|$)/g, 'focus:border-orange-500'],
  [/(?<=^|\s)focus:border-emerald-400(?=\s|$)/g, 'focus:border-emerald-500'],
  [/(?<=^|\s)focus:border-red-400(?=\s|$)/g, 'focus:border-red-500'],
  [/(?<=^|\s)focus:border-purple-400(?=\s|$)/g, 'focus:border-purple-500'],
];

function processFile(filePath) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipping: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  // Apply all regex replacements
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  // Clean up whitespace artifacts from removed classes
  content = content.replace(/  +/g, ' ');
  content = content.replace(/" +/g, '"');
  content = content.replace(/ +"/g, '"');
  content = content.replace(/className="" /g, '');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  console.log(`  No changes: ${filePath}`);
  return false;
}

console.log('=== Fixing contrast issues across all components ===\n');

let updated = 0;
for (const file of files) {
  if (processFile(file)) updated++;
}

console.log(`\n✅ ${updated} files updated.`);  // Handle StatsCard.tsx specifically for the JS object value
console.log('\n--- Handling StatsCard.tsx object value ---');
const statsCardPath = path.join(root, 'src/components/StatsCard.tsx');
if (fs.existsSync(statsCardPath)) {
  let scContent = fs.readFileSync(statsCardPath, 'utf-8');
  const scOriginal = scContent;
  // bg: 'bg-white' inside JS object - use bg-gray-700 for visible card bg on dark
  scContent = scContent.replace(/bg:\s*'bg-white'/g, "bg: 'bg-gray-700'");
  if (scContent !== scOriginal) {
    fs.writeFileSync(statsCardPath, scContent);
    console.log('✓ StatsCard.tsx: bg: bg-white → bg-gray-700');
  } else {
    console.log('  StatsCard.tsx: no changes needed');
  }
}
