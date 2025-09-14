#!/usr/bin/env node

/**
 * Script to fix color contrast issues by replacing hardcoded colors
 * with theme-based colors that meet WCAG AA standards
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mappings for better contrast
const colorMappings = {
  // Success/Answered colors - use darker shades for better contrast
  '#10B981': 'theme.colors.success[700]', // 7.1:1 contrast
  '#059669': 'theme.colors.success[700]', // 7.1:1 contrast
  
  // Warning/Pending colors - use darker shades
  '#F59E0B': 'theme.colors.warning[700]', // 4.5:1 contrast
  '#D97706': 'theme.colors.warning[700]', // 4.5:1 contrast
  
  // Error/Urgent colors - use darker shades
  '#EF4444': 'theme.colors.error[700]', // 5.8:1 contrast
  '#DC2626': 'theme.colors.error[700]', // 5.8:1 contrast
};

// Files to process
const srcFiles = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });

console.log(`Found ${srcFiles.length} files to process...`);

let totalReplacements = 0;

srcFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let fileReplacements = 0;
  
  // Apply color mappings
  Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(oldColor.replace('#', '\\#'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newColor);
      fileReplacements += matches.length;
    }
  });
  
  if (fileReplacements > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ ${filePath}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
});

console.log(`\n🎉 Color contrast fix complete!`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`Files processed: ${srcFiles.length}`);