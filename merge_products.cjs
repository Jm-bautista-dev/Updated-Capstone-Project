const fs = require('fs');

const original = fs.readFileSync('original_products.tsx', 'utf8');
const darkBlock = fs.readFileSync('new_dark_products_block.txt', 'utf8');

const lightStart = '<div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">';
const lightEnd = '            {/* Modals Sub-Components */}';

const parts = original.split(lightStart);
if (parts.length < 2) {
    console.error("Light start not found");
    process.exit(1);
}
const lightBlock = parts[1].split(lightEnd)[0];

let newContent = original.replace(
  "import React, { useState, useMemo, useEffect } from 'react';",
  "import React, { useState, useMemo, useEffect } from 'react';\nimport { useAppearance } from '@/hooks/use-appearance';"
);

newContent = newContent.replace(
  "export default function ProductsIndex() {\n    const { products: rawProducts, categories, ingredients: rawIngredients, summary, filters, branches, currentBranchId, isAdmin, allowedUnits } = usePage().props as any;",
  "export default function ProductsIndex() {\n    const { products: rawProducts, categories, ingredients: rawIngredients, summary, filters, branches, currentBranchId, isAdmin, allowedUnits } = usePage().props as any;\n    const { resolvedAppearance } = useAppearance();"
);

const layoutStr = lightStart + lightBlock;
const newLayoutStr = `{resolvedAppearance === 'dark' ? (\n${darkBlock}\n) : (\n${lightStart}${lightBlock}\n)}`;

if (!newContent.includes(layoutStr)) {
    console.error("Layout string to replace not found in current content");
    process.exit(1);
}

newContent = newContent.replace(layoutStr, newLayoutStr);

fs.writeFileSync('resources/js/Pages/Products/Index.tsx', newContent);
console.log("Success");
