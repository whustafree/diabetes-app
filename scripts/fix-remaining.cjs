const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const fileFixes = {
  'src/App.tsx': [
    // Fix ternary: 'bg-white bg-gray-600' → just 'bg-gray-700'
    ["'bg-white bg-gray-600", "'bg-gray-700"],
    ["'bg-white bg-gray-600", "'bg-gray-700"],
  ],
  'src/components/AuthModal.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/ErrorBoundary.tsx': [
    // Remove light gradient, keep dark one
    ['from-red-50 via-white to-orange-50 ', ''],
  ],
  'src/components/FoodLog.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/GlucoseForm.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/GlucoseLog.tsx': [],
  'src/components/LoginPage.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/MealPlanner.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/Medications.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/NotificationsPage.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/Reminders.tsx': [
    ['focus:bg-white ', ''],
  ],
  'src/components/SettingsPage.tsx': [
    ['focus:bg-white ', ''],
    ["'bg-white bg-gray-600", "'bg-gray-700"],
  ],
  'src/components/UserProfile.tsx': [
    ['focus:bg-white ', ''],
  ],
};

let updated = 0;
for (const [filePath, fixes] of Object.entries(fileFixes)) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipping (not found): ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  
  for (const [search, replace] of fixes) {
    content = content.split(search).join(replace);
  }
  
  // Also clean up: if focus:bg-gray-700 already follows, just remove focus:bg-white
  // Actually the str_replace above handles this
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed: ${filePath}`);
    updated++;
  } else {
    console.log(`  No changes needed: ${filePath}`);
  }
}

console.log(`\n✅ ${updated} files fixed.`);

// Also check StatsCard.tsx - it has bg: 'bg-white' which is an object value, not a className
// This is a configuration mapping, not a CSS class. We should NOT change it.
console.log('\nNote: StatsCard.tsx line 36 has bg: "bg-white" in JS object (not className). Left as is.');
