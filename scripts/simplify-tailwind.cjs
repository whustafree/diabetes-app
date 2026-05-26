const fs = require('fs');
const path = require('path');

const files = [
  'src/App.tsx',
  'src/components/AuthModal.tsx',
  'src/components/ConfirmModal.tsx',
  'src/components/Dashboard.tsx',
  'src/components/DietPlan.tsx',
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
  'src/contexts/ThemeContext.tsx',
  'src/hooks/useAppData.ts',
  'src/main.tsx',
];

const projectRoot = path.resolve(__dirname, '..');

function processFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping (not found): ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  
  // ─── 1. Gradient backgrounds ───
  content = content.replace(
    /from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900/g,
    'from-gray-900 via-gray-800 to-slate-900'
  );
  
  // ─── 2. Common light+dark pairs ───
  const pairs = [
    { light: 'bg-white', dark: 'bg-gray-800' },
    { light: 'bg-white/80', dark: 'bg-gray-800/80' },
    { light: 'bg-white/90', dark: 'bg-gray-800/90' },
    { light: 'bg-gray-50', dark: 'bg-gray-800' },
    { light: 'bg-gray-100', dark: 'bg-gray-700' },
    { light: 'text-gray-900', dark: 'text-gray-100' },
    { light: 'text-gray-800', dark: 'text-gray-200' },
    { light: 'text-gray-700', dark: 'text-gray-300' },
    { light: 'text-gray-600', dark: 'text-gray-400' },
    { light: 'text-gray-500', dark: 'text-gray-400' },
    { light: 'text-gray-400', dark: 'text-gray-400' },
    { light: 'border-gray-200', dark: 'border-gray-700' },
    { light: 'border-gray-100', dark: 'border-gray-700' },
    { light: 'divide-gray-200', dark: 'divide-gray-700' },
    { light: 'shadow-blue-200', dark: 'shadow-blue-900/50' },
    { light: 'ring-1 ring-gray-200', dark: 'ring-1 ring-gray-700' },
    { light: 'ring-gray-200', dark: 'ring-gray-700' },
    { light: 'placeholder-gray-400', dark: 'placeholder-gray-500' },
  ];
  
  for (const { light, dark } of pairs) {
    const escapedLight = light.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const escapedDark = dark.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const regex = new RegExp(`${escapedLight}\\s+dark:${escapedDark}`, 'g');
    content = content.replace(regex, dark);
  }
  
  // ─── 3. Colored backgrounds (bg-COLOR-50 dark:bg-COLOR-900/20) ───
  const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'indigo', 'orange', 'pink', 'teal', 'cyan', 'amber', 'lime', 'emerald', 'sky', 'violet', 'rose', 'fuchsia'];
  for (const color of colors) {
    // bg-COLOR-50 dark:bg-COLOR-900/20
    let regex = new RegExp(`bg-${color}-50\\s+dark:bg-${color}-900\\/20`, 'g');
    content = content.replace(regex, `bg-${color}-900/20`);
    // bg-COLOR-50 dark:bg-COLOR-900/30
    regex = new RegExp(`bg-${color}-50\\s+dark:bg-${color}-900\\/30`, 'g');
    content = content.replace(regex, `bg-${color}-900/30`);
    // bg-COLOR-50 dark:bg-COLOR-800/20
    regex = new RegExp(`bg-${color}-50\\s+dark:bg-${color}-800\\/20`, 'g');
    content = content.replace(regex, `bg-${color}-800/20`);
    // bg-COLOR-100 dark:bg-COLOR-900/30
    regex = new RegExp(`bg-${color}-100\\s+dark:bg-${color}-900\\/30`, 'g');
    content = content.replace(regex, `bg-${color}-900/30`);
    // bg-COLOR-100 dark:bg-COLOR-800/30
    regex = new RegExp(`bg-${color}-100\\s+dark:bg-${color}-800\\/30`, 'g');
    content = content.replace(regex, `bg-${color}-800/30`);
  }
  
  // ─── 4. Colored text ───
  for (const color of colors) {
    // text-COLOR-600 dark:text-COLOR-400
    let regex = new RegExp(`text-${color}-600\\s+dark:text-${color}-400`, 'g');
    content = content.replace(regex, `text-${color}-400`);
    // text-COLOR-500 dark:text-COLOR-400
    regex = new RegExp(`text-${color}-500\\s+dark:text-${color}-400`, 'g');
    content = content.replace(regex, `text-${color}-400`);
    // text-COLOR-700 dark:text-COLOR-300
    regex = new RegExp(`text-${color}-700\\s+dark:text-${color}-300`, 'g');
    content = content.replace(regex, `text-${color}-300`);
    // text-COLOR-400 dark:text-COLOR-400
    regex = new RegExp(`text-${color}-400\\s+dark:text-${color}-400`, 'g');
    content = content.replace(regex, `text-${color}-400`);
  }
  
  // ─── 5. Hover states ───
  const hoverPairs = [
    { light: 'hover:bg-gray-50', dark: 'hover:bg-gray-700' },
    { light: 'hover:bg-gray-50', dark: 'hover:bg-gray-700/50' },
    { light: 'hover:bg-gray-100', dark: 'hover:bg-gray-700' },
    { light: 'hover:bg-gray-100', dark: 'hover:bg-gray-700/50' },
    { light: 'hover:bg-gray-100', dark: 'hover:bg-gray-700/80' },
    { light: 'hover:bg-gray-50', dark: 'hover:bg-gray-700/80' },
    { light: 'hover:text-gray-700', dark: 'hover:text-gray-300' },
    { light: 'hover:text-gray-600', dark: 'hover:text-gray-400' },
    { light: 'hover:border-gray-300', dark: 'hover:border-gray-600' },
  ];
  
  for (const { light, dark } of hoverPairs) {
    const escapedLight = light.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const escapedDark = dark.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const regex = new RegExp(`${escapedLight}\\s+dark:${escapedDark}`, 'g');
    content = content.replace(regex, dark);
  }
  
  // ─── 6. Focus states ───
  const focusPairs = [
    { light: 'focus:ring-blue-500', dark: 'focus:ring-blue-400' },
    { light: 'focus:border-blue-500', dark: 'focus:border-blue-400' },
    { light: 'focus:ring-indigo-500', dark: 'focus:ring-indigo-400' },
    { light: 'focus:border-indigo-500', dark: 'focus:border-indigo-400' },
    { light: 'focus:ring-2 focus:ring-blue-500', dark: 'focus:ring-2 focus:ring-blue-400' },
    { light: 'focus:ring-offset-2', dark: 'focus:ring-offset-gray-800' },
  ];
  
  for (const { light, dark } of focusPairs) {
    const escapedLight = light.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const escapedDark = dark.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const regex = new RegExp(`${escapedLight}\\s+dark:${escapedDark}`, 'g');
    content = content.replace(regex, dark);
  }
  
  // ─── 7. Border colors (colored borders) ───
  for (const color of colors) {
    // border-COLOR-200 dark:border-COLOR-700
    let regex = new RegExp(`border-${color}-200\\s+dark:border-${color}-700`, 'g');
    content = content.replace(regex, `border-${color}-700`);
    // border-COLOR-300 dark:border-COLOR-600
    regex = new RegExp(`border-${color}-300\\s+dark:border-${color}-600`, 'g');
    content = content.replace(regex, `border-${color}-600`);
  }
  
  // ─── 8. Divide colors ───
  for (const color of colors) {
    const regex = new RegExp(`divide-${color}-200\\s+dark:divide-${color}-700`, 'g');
    content = content.replace(regex, `divide-${color}-700`);
  }
  
  // ─── 9. Remove remaining dark: prefix ───
  // This handles any edge cases not covered above
  content = content.replace(/dark:(\S+)/g, '$1');
  
  // ─── 10. Clean up duplicate classes and extra spaces ───
  content = content.replace(/  +/g, ' ').replace(/" +/g, '"').replace(/ +"/g, '"');
  content = content.replace(/className=" "/g, 'className=""');
  content = content.replace(/class=" "/g, 'class=""');
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  console.log(`  No changes: ${filePath}`);
  return false;
}

// Process files
let updated = 0;
for (const file of files) {
  if (processFile(file)) updated++;
}

console.log(`\n✅ Done! ${updated} files updated.`);
