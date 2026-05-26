const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');

// ─── Reemplazos globales ───
// Pattern: [regex, replacement] — aplicados con flags 'g' a cada archivo .tsx y .ts

const replacements = [
  // ── UserProfile.tsx: Health Risk cards ──
  // bg-red-50 border-red-200 → dark equivalents
  [/(?<=^|\s)bg-red-50(?=\s+border-red-200\b)/g, 'bg-red-900/30'],
  [/(?<=\bbg-red-900\/30\s+)border-red-200\b/g, 'border-red-800'],
  // bg-yellow-50 border-yellow-200 → dark
  [/(?<=^|\s)bg-yellow-50(?=\s+border-yellow-200\b)/g, 'bg-yellow-900/30'],
  [/(?<=\bbg-yellow-900\/30\s+)border-yellow-200\b/g, 'border-yellow-800'],
  // text-red-700 → text-red-300 (for risk condition)
  [/(?<=^|\s)text-red-700(?=\s)/g, 'text-red-300'],
  [/(?<=^|\s)text-yellow-700(?=\s)/g, 'text-yellow-300'],
  // Risk badges: bg-red-200 text-red-800, bg-yellow-200 text-yellow-800
  [/(?<=^|\s)bg-red-200(?=\s+text-red-800\b)/g, 'bg-red-900/50'],
  [/(?<=\bbg-red-900\/50\s+)text-red-800\b/g, 'text-red-300'],
  [/(?<=^|\s)bg-yellow-200(?=\s+text-yellow-800\b)/g, 'bg-yellow-900/50'],
  [/(?<=\bbg-yellow-900\/50\s+)text-yellow-800\b/g, 'text-yellow-300'],
  // Recommendation text-blue-600 → text-blue-400
  [/(?<=💡\s+Recomendación:\s+<span\s+class=")text-blue-600/g, 'text-blue-400'],

  // ── UserProfile.tsx: Target cards ──
  // bg-blue-100 border-blue-100 → dark
  [/(?<=^|\s)bg-blue-100(?=\s+border-blue-100\b)/g, 'bg-blue-900/30'],
  [/(?<=\bbg-blue-900\/30\s+)border-blue-100\b/g, 'border-blue-800'],
  // text-blue-700, text-blue-800 → text-blue-300, text-blue-200
  [/(?<=^|\s)text-blue-700(?=\s)/g, 'text-blue-300'],
  [/(?<=^|\s)text-blue-800(?=\s)/g, 'text-blue-200'],
  // bg-purple-100 border-purple-100 → dark
  [/(?<=^|\s)bg-purple-100(?=\s+border-purple-100\b)/g, 'bg-purple-900/30'],
  [/(?<=\bbg-purple-900\/30\s+)border-purple-100\b/g, 'border-purple-800'],
  // text-purple-700, text-purple-800 → text-purple-300, text-purple-200
  [/(?<=^|\s)text-purple-700(?=\s)/g, 'text-purple-300'],
  [/(?<=^|\s)text-purple-800(?=\s)/g, 'text-purple-200'],

  // ── health.ts ──
  // bmiCategoryColors
  ['text-blue-600 bg-blue-50', 'text-blue-400 bg-blue-900/30'],
  ['text-green-600 bg-green-50', 'text-green-400 bg-green-900/30'],
  ['text-yellow-600 bg-yellow-50', 'text-yellow-400 bg-yellow-900/30'],
  ['text-orange-600 bg-orange-50', 'text-orange-400 bg-orange-900/30'],
  ['text-red-600 bg-red-50', 'text-red-400 bg-red-900/30'],
  ['text-red-700 bg-red-100', 'text-red-300 bg-red-900/40'],
  // riskLevelColors
  ['text-green-600 bg-green-50 border-green-200', 'text-green-400 bg-green-900/30 border-green-800'],
  ['text-yellow-600 bg-yellow-50 border-yellow-200', 'text-yellow-400 bg-yellow-900/30 border-yellow-800'],
  ['text-orange-600 bg-orange-50 border-orange-200', 'text-orange-400 bg-orange-900/30 border-orange-800'],
  ['text-red-600 bg-red-50 border-red-200', 'text-red-400 bg-red-900/30 border-red-800'],
  // getBodyFatColor returns
  ['text-green-600 bg-green-50', 'text-green-400 bg-green-900/30'],
  ['text-blue-600 bg-blue-50', 'text-blue-400 bg-blue-900/30'],
  ['text-yellow-600 bg-yellow-50', 'text-yellow-400 bg-yellow-900/30'],
  ['text-red-600 bg-red-50', 'text-red-400 bg-red-900/30'],

  // ── DietPlan.tsx ──
  // Macro card colors
  ['color: \'text-blue-600\', bg: \'bg-blue-50\'', 'color: \'text-blue-400\', bg: \'bg-blue-900/30\''],
  ['color: \'text-orange-600\', bg: \'bg-orange-50\'', 'color: \'text-orange-400\', bg: \'bg-orange-900/30\''],
  ['color: \'text-purple-600\', bg: \'bg-purple-50\'', 'color: \'text-purple-400\', bg: \'bg-purple-900/30\''],
  ['color: \'text-green-600\', bg: \'bg-green-50\'', 'color: \'text-green-400\', bg: \'bg-green-900/30\''],

  // ── MealPlanner.tsx ──
  // igColors
  ["bajo: 'bg-green-100 text-green-700'", "bajo: 'bg-green-900/40 text-green-300'"],
  ["medio: 'bg-yellow-100 text-yellow-700'", "medio: 'bg-yellow-900/40 text-yellow-300'"],
  ["alto: 'bg-red-100 text-red-700'", "alto: 'bg-red-900/40 text-red-300'"],
  // Meal slot icon bg colors (meal planner cards)
  ["meal.slot === 'desayuno' ? 'bg-yellow-100' :", "meal.slot === 'desayuno' ? 'bg-yellow-900/40' :"],
  ["meal.slot === 'almuerzo' ? 'bg-orange-100' :", "meal.slot === 'almuerzo' ? 'bg-orange-900/40' :"],
  ["meal.slot === 'cena' ? 'bg-indigo-100' : 'bg-green-100'", "meal.slot === 'cena' ? 'bg-indigo-900/40' : 'bg-green-900/40'"],
  // Nutrition summary cards (grid of 4)
  ['rounded-lg bg-blue-50', 'rounded-lg bg-blue-900/30'],
  ['rounded-lg bg-orange-50', 'rounded-lg bg-orange-900/30'],
  ['rounded-lg bg-purple-50', 'rounded-lg bg-purple-900/30'],
  ['rounded-lg bg-green-50', 'rounded-lg bg-green-900/30'],
  // text colors in nutrition summary
  ['text-sm font-bold text-blue-700', 'text-sm font-bold text-blue-300'],
  ['text-sm font-bold text-orange-700', 'text-sm font-bold text-orange-300'],
  ['text-sm font-bold text-purple-700', 'text-sm font-bold text-purple-300'],
  ['text-sm font-bold text-green-700', 'text-sm font-bold text-green-300'],
  // text-red-700 in glucose suggestion
  ['text-red-700 mb-1.5', 'text-red-400 mb-1.5'],
  ['text-green-700 mb-1.5', 'text-green-400 mb-1.5'],
  // Recipe search result icon bg
  ['w-10 h-10 rounded-lg bg-blue-100', 'w-10 h-10 rounded-lg bg-blue-900/30'],
  // RecipeDetail tags: text-blue-600
  ['text-blue-600', 'text-blue-400'],
  // RecipeDetail gradient from-green-50 to-emerald-50
  ['from-green-50 to-emerald-50', 'from-green-900/30 to-emerald-900/30'],
  // RecipeDetail ingredient border
  ['border-b border-gray-50', 'border-b border-gray-700'],
];

// ─── Colectar archivos .tsx y .ts ───
function getFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      files.push(...getFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(full);
    }
  }
  return files;
}

const files = getFiles(srcDir);
const updatedFiles = [];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  const relPath = path.relative(path.join(__dirname, '..'), filePath);

  for (const [pattern, replacement] of replacements) {
    if (typeof pattern === 'string') {
      // String replacement (exact match)
      if (content.includes(pattern)) {
        content = content.split(pattern).join(replacement);
      }
    } else {
      // Regex replacement
      content = content.replace(pattern, replacement);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedFiles.push(relPath);
  }
}

console.log('=== Archivos actualizados ===');
for (const f of updatedFiles) {
  console.log(`  ✅ ${f}`);
}
console.log(`\nTotal: ${updatedFiles.length} archivos modificados`);
