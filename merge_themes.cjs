const fs = require('fs');

const original = fs.readFileSync('original_pos_utf8.tsx', 'utf8');
const current = fs.readFileSync('resources/js/Pages/Pos/Index.tsx', 'utf8');

const lightStart = '<div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/20">';
const lightEnd = '      {/* Payment Modal */}';
const lightParts = original.split(lightStart);
if (lightParts.length < 2) {
    console.error("Light start not found");
    process.exit(1);
}
const lightBlock = lightParts[1].split(lightEnd)[0];

const darkStart = '<div className="flex gap-4 p-4 h-[calc(100vh-64px)] overflow-hidden bg-[#050505] text-slate-200 font-sans relative selection:bg-primary/30">';
const darkEnd = '      {/* Payment Modal */}';
const darkParts = current.split(darkStart);
if (darkParts.length < 2) {
    console.error("Dark start not found");
    process.exit(1);
}
const darkBlock = darkParts[1].split(darkEnd)[0];

let newContent = current.replace(
  "import { useState, useMemo, useEffect } from 'react';",
  "import { useState, useMemo, useEffect } from 'react';\nimport { useAppearance } from '@/hooks/use-appearance';"
);

newContent = newContent.replace(
  "export default function PosIndex() {\n  const { products, categories, branch, availableRiders } = usePage().props as any;",
  "export default function PosIndex() {\n  const { products, categories, branch, availableRiders } = usePage().props as any;\n  const { resolvedAppearance } = useAppearance();"
);

const layoutStr = darkStart + darkBlock;
const newLayoutStr = `{resolvedAppearance === 'dark' ? (\n${darkStart}${darkBlock}\n) : (\n${lightStart}${lightBlock}\n)}`;

if (!newContent.includes(layoutStr)) {
    console.error("Layout string to replace not found in current content");
    process.exit(1);
}

newContent = newContent.replace(layoutStr, newLayoutStr);

fs.writeFileSync('resources/js/Pages/Pos/Index.tsx', newContent);
console.log("Success");
