const fs = require('fs');
const path = require('path');

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
  'src/index.css',
  'src/contexts/AuthContext.tsx',
  'src/hooks/useAppData.ts',
  'src/main.tsx',
];

const projectRoot = path.resolve(__dirname, '..');

// Light → Dark class replacements (word-boundary safe)
// Each key is a regex pattern, value is the replacement string
const replacements = [
  // Step 1: Remove all remaining dark: prefixes (for ErrorBoundary.tsx and any leftovers)
  [/dark:(\S+)/g, '$1'],

  // Step 2: Fix ring-offset issue - was incorrectly combined by first script
  // 'focus:ring-offset-2 dark:focus:ring-offset-gray-800' became 'focus:ring-offset-gray-800'
  // Need to add back 'focus:ring-offset-2'
  [/(?<=^|\s)focus:ring-offset-gray-\d{3}(?=\s|$)/g, 'focus:ring-offset-2 focus:ring-offset-gray-800'],

  // Step 3: Remove leftover light-mode classes (word-boundary safe)
  // Using lookbehind/lookahead to ensure we only match standalone class tokens
  
  // Backgrounds
  [/(?<=^|\s)bg-white(?=\s|$)/g, 'bg-gray-800'],
  [/(?<=^|\s)bg-gray-50(?=\s|$)/g, 'bg-gray-700'],
  [/(?<=^|\s)bg-gray-100(?=\s|$)/g, 'bg-gray-700'],
  
  // Text colors (dark text on dark bg = bad)
  [/(?<=^|\s)text-gray-900(?=\s|$)/g, 'text-gray-100'],
  [/(?<=^|\s)text-gray-800(?=\s|$)/g, 'text-gray-200'],
  [/(?<=^|\s)text-gray-700(?=\s|$)/g, 'text-gray-300'],
  [/(?<=^|\s)text-gray-600(?=\s|$)/g, 'text-gray-400'],
  [/(?<=^|\s)text-gray-500(?=\s|$)/g, 'text-gray-400'],
  
  // Borders
  [/(?<=^|\s)border-gray-200(?=\s|$)/g, 'border-gray-700'],
  [/(?<=^|\s)border-gray-100(?=\s|$)/g, 'border-gray-700'],
  
  // Hover states
  [/(?<=^|\s)hover:bg-gray-50(?=\s|$)/g, 'hover:bg-gray-700'],
  [/(?<=^|\s)hover:bg-gray-100(?=\s|$)/g, 'hover:bg-gray-700'],
  [/(?<=^|\s)hover:text-gray-700(?=\s|$)/g, 'hover:text-gray-300'],
  [/(?<=^|\s)hover:text-gray-600(?=\s|$)/g, 'hover:text-gray-400'],
  [/(?<=^|\s)hover:border-gray-300(?=\s|$)/g, 'hover:border-gray-600'],
  
  // Dividers
  [/(?<=^|\s)divide-gray-200(?=\s|$)/g, 'divide-gray-700'],
  
  // Placeholder
  [/(?<=^|\s)placeholder-gray-400(?=\s|$)/g, 'placeholder-gray-500'],
  
  // Shadows
  [/(?<=^|\s)shadow-blue-200(?=\s|$)/g, 'shadow-blue-900/50'],
  [/(?<=^|\s)shadow-red-200(?=\s|$)/g, 'shadow-red-900/50'],
  
  // Rings
  [/(?<=^|\s)ring-gray-200(?=\s|$)/g, 'ring-gray-700'],
  
  // Colored text (light variants to dark variants)
  [/(?<=^|\s)text-blue-600(?=\s|$)/g, 'text-blue-400'],
  [/(?<=^|\s)text-blue-500(?=\s|$)/g, 'text-blue-400'],
  [/(?<=^|\s)text-green-600(?=\s|$)/g, 'text-green-400'],
  [/(?<=^|\s)text-green-500(?=\s|$)/g, 'text-green-400'],
  [/(?<=^|\s)text-red-600(?=\s|$)/g, 'text-red-400'],
  [/(?<=^|\s)text-red-500(?=\s|$)/g, 'text-red-400'],
  [/(?<=^|\s)text-yellow-600(?=\s|$)/g, 'text-yellow-400'],
  [/(?<=^|\s)text-yellow-500(?=\s|$)/g, 'text-yellow-400'],
  [/(?<=^|\s)text-indigo-600(?=\s|$)/g, 'text-indigo-400'],
  [/(?<=^|\s)text-indigo-500(?=\s|$)/g, 'text-indigo-400'],
  [/(?<=^|\s)text-purple-600(?=\s|$)/g, 'text-purple-400'],
  [/(?<=^|\s)text-purple-500(?=\s|$)/g, 'text-purple-400'],
  [/(?<=^|\s)text-orange-600(?=\s|$)/g, 'text-orange-400'],
  [/(?<=^|\s)text-orange-500(?=\s|$)/g, 'text-orange-400'],
  [/(?<=^|\s)text-emerald-600(?=\s|$)/g, 'text-emerald-400'],
  [/(?<=^|\s)text-emerald-500(?=\s|$)/g, 'text-emerald-400'],
  [/(?<=^|\s)text-pink-600(?=\s|$)/g, 'text-pink-400'],
  [/(?<=^|\s)text-pink-500(?=\s|$)/g, 'text-pink-400'],
  
  // Colored backgrounds (light variants to dark variants)
  [/(?<=^|\s)bg-blue-50(?=\s|$)/g, 'bg-blue-900/20'],
  [/(?<=^|\s)bg-green-50(?=\s|$)/g, 'bg-green-900/20'],
  [/(?<=^|\s)bg-red-50(?=\s|$)/g, 'bg-red-900/20'],
  [/(?<=^|\s)bg-yellow-50(?=\s|$)/g, 'bg-yellow-900/20'],
  [/(?<=^|\s)bg-purple-50(?=\s|$)/g, 'bg-purple-900/20'],
  [/(?<=^|\s)bg-indigo-50(?=\s|$)/g, 'bg-indigo-900/20'],
  [/(?<=^|\s)bg-orange-50(?=\s|$)/g, 'bg-orange-900/20'],
  [/(?<=^|\s)bg-pink-50(?=\s|$)/g, 'bg-pink-900/20'],
  [/(?<=^|\s)bg-emerald-50(?=\s|$)/g, 'bg-emerald-900/20'],
  [/(?<=^|\s)bg-cyan-50(?=\s|$)/g, 'bg-cyan-900/20'],
  
  // Colored borders
  [/(?<=^|\s)border-blue-200(?=\s|$)/g, 'border-blue-700'],
  [/(?<=^|\s)border-green-200(?=\s|$)/g, 'border-green-700'],
  [/(?<=^|\s)border-red-200(?=\s|$)/g, 'border-red-700'],
  [/(?<=^|\s)border-yellow-200(?=\s|$)/g, 'border-yellow-700'],
  [/(?<=^|\s)border-purple-200(?=\s|$)/g, 'border-purple-700'],
  [/(?<=^|\s)border-indigo-200(?=\s|$)/g, 'border-indigo-700'],
  [/(?<=^|\s)border-orange-200(?=\s|$)/g, 'border-orange-700'],
  [/(?<=^|\s)border-emerald-200(?=\s|$)/g, 'border-emerald-700'],
  
  // Focus rings
  [/(?<=^|\s)focus:ring-blue-500(?=\s|$)/g, 'focus:ring-blue-400'],
  [/(?<=^|\s)focus:border-blue-500(?=\s|$)/g, 'focus:border-blue-400'],
  [/(?<=^|\s)focus:ring-indigo-500(?=\s|$)/g, 'focus:ring-indigo-400'],
  [/(?<=^|\s)focus:border-indigo-500(?=\s|$)/g, 'focus:border-indigo-400'],
  [/(?<=^|\s)focus:ring-emerald-500(?=\s|$)/g, 'focus:ring-emerald-400'],
  [/(?<=^|\s)focus:border-emerald-500(?=\s|$)/g, 'focus:border-emerald-400'],
  [/(?<=^|\s)focus:ring-red-500(?=\s|$)/g, 'focus:ring-red-400'],
  [/(?<=^|\s)focus:border-red-500(?=\s|$)/g, 'focus:border-red-400'],
  [/(?<=^|\s)focus:ring-purple-500(?=\s|$)/g, 'focus:ring-purple-400'],
  [/(?<=^|\s)focus:border-purple-500(?=\s|$)/g, 'focus:border-purple-400'],
  [/(?<=^|\s)focus:ring-orange-500(?=\s|$)/g, 'focus:ring-orange-400'],
  [/(?<=^|\s)focus:border-orange-500(?=\s|$)/g, 'focus:border-orange-400'],
  
  // Colored ring variants
  [/(?<=^|\s)ring-blue-200(?=\s|$)/g, 'ring-blue-700'],
  [/(?<=^|\s)ring-emerald-200(?=\s|$)/g, 'ring-emerald-700'],
  [/(?<=^|\s)ring-red-200(?=\s|$)/g, 'ring-red-700'],
  [/(?<=^|\s)ring-orange-200(?=\s|$)/g, 'ring-orange-700'],
  [/(?<=^|\s)ring-purple-200(?=\s|$)/g, 'ring-purple-700'],
];

function processFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipping (not found): ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  
  // Apply all replacements
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  // Clean up extra whitespace and duplicate classes
  content = content.replace(/  +/g, ' ');
  content = content.replace(/" +/g, '"');
  content = content.replace(/ +"/g, '"');
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  console.log(`  No changes: ${filePath}`);
  return false;
}

console.log('=== Second pass: Finalizing Tailwind classes ===\n');

let updated = 0;
for (const file of files) {
  if (processFile(file)) updated++;
}

console.log(`\n✅ Done! ${updated} files updated in second pass.`);

// Verify no remaining dark: prefixes in .tsx files
console.log('\n=== Verifying no remaining dark: prefixes ===');
const tsxFiles = fs.readdirSync(path.join(projectRoot, 'src/components'))
  .filter(f => f.endsWith('.tsx'))
  .concat(['App.tsx', 'main.tsx', 'ErrorBoundary.tsx']);

let darkFound = false;
for (const file of tsxFiles) {
  const fp = file.includes('/') ? path.join(projectRoot, file) : path.join(projectRoot, 'src', file);
  if (!fs.existsSync(fp)) fp = path.join(projectRoot, 'src/components', file);
  // Actually let me just check all .tsx files
}

// Simple check
const allFiles = fs.readdirSync(path.join(projectRoot, 'src'), { recursive: true })
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css'))
  .map(f => path.join(projectRoot, 'src', f));

let hasDark = false;
for (const f of allFiles.filter(f => fs.existsSync(f))) {
  const content = fs.readFileSync(f, 'utf-8');
  const matches = content.match(/dark:\S+/g);
  if (matches) {
    console.log(`⚠️  Found dark: in ${path.relative(projectRoot, f)}: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
    hasDark = true;
  }
}

if (!hasDark) {
  console.log('✅ No remaining dark: prefixes found!');
}
