const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color mapping rules - prioritize brand classes for chapter branding support
const colorMappings = {
  // Navy to Brand Primary (supports chapter branding - USE THESE)
  'bg-navy-600': 'bg-brand-primary',
  'bg-navy-700': 'bg-brand-primary-hover',
  'bg-navy-500': 'bg-brand-primary',
  'bg-navy-800': 'bg-primary-800',
  'bg-navy-900': 'bg-primary-900',
  'bg-navy-400': 'bg-primary-400',
  'bg-navy-300': 'bg-primary-300',
  'bg-navy-200': 'bg-primary-200',
  'bg-navy-100': 'bg-primary-100',
  'bg-navy-50': 'bg-primary-50',
  
  'text-navy-600': 'text-brand-primary',
  'text-navy-700': 'text-brand-primary-hover',
  'text-navy-500': 'text-brand-primary',
  'text-navy-900': 'text-primary-900',
  'text-navy-800': 'text-primary-800',
  'text-navy-400': 'text-primary-400',
  'text-navy-300': 'text-primary-300',
  'text-navy-200': 'text-primary-200',
  'text-navy-100': 'text-primary-100',
  'text-navy-50': 'text-primary-50',
  
  'border-navy-600': 'border-brand-primary',
  'border-navy-700': 'border-brand-primary-hover',
  'border-navy-500': 'border-brand-primary',
  'border-navy-900': 'border-primary-900',
  'border-navy-800': 'border-primary-800',
  'border-navy-400': 'border-primary-400',
  'border-navy-300': 'border-primary-300',
  'border-navy-200': 'border-primary-200',
  'border-navy-100': 'border-primary-100',
  'border-navy-50': 'border-primary-50',
  
  // Focus states - use brand for chapter branding
  'focus:border-navy-500': 'focus:border-brand-primary',
  'focus:border-navy-600': 'focus:border-brand-primary',
  'focus:ring-navy-500': 'focus:ring-brand-primary',
  'focus:ring-navy-600': 'focus:ring-brand-primary',
  
  // Blue to Accent (for brand-related blues - supports chapter branding)
  'bg-blue-600': 'bg-brand-accent', // Brand-related blues
  'bg-blue-500': 'bg-accent-500',
  'bg-blue-700': 'bg-accent-700',
  'bg-blue-800': 'bg-accent-800',
  'bg-blue-900': 'bg-accent-900',
  'bg-blue-400': 'bg-accent-400',
  'bg-blue-300': 'bg-accent-300',
  'bg-blue-200': 'bg-accent-200',
  'bg-blue-100': 'bg-accent-100',
  'bg-blue-50': 'bg-accent-50',
  
  'text-blue-600': 'text-brand-accent',
  'text-blue-500': 'text-accent-500',
  'text-blue-700': 'text-accent-700',
  'text-blue-800': 'text-accent-800',
  'text-blue-900': 'text-accent-900',
  'text-blue-400': 'text-accent-400',
  'text-blue-300': 'text-accent-300',
  'text-blue-200': 'text-accent-200',
  'text-blue-100': 'text-accent-100',
  'text-blue-50': 'text-accent-50',
  
  'border-blue-600': 'border-brand-accent',
  'border-blue-500': 'border-accent-500',
  'border-blue-700': 'border-accent-700',
  'border-blue-800': 'border-accent-800',
  'border-blue-200': 'border-accent-200',
  'border-blue-100': 'border-accent-100',
  
  'focus:border-blue-500': 'focus:border-brand-accent',
  'focus:border-blue-600': 'focus:border-brand-accent',
  'focus:ring-blue-500': 'focus:ring-brand-accent',
  'focus:ring-blue-600': 'focus:ring-brand-accent',
  
  // Hover states
  'hover:bg-navy-600': 'hover:bg-brand-primary',
  'hover:bg-navy-700': 'hover:bg-brand-primary-hover',
  'hover:bg-navy-50': 'hover:bg-primary-50',
  'hover:bg-navy-100': 'hover:bg-primary-100',
  'hover:text-navy-600': 'hover:text-brand-primary',
  'hover:text-navy-700': 'hover:text-brand-primary-hover',
  'hover:text-navy-900': 'hover:text-primary-900',
  'hover:border-navy-600': 'hover:border-brand-primary',
  
  'hover:bg-blue-600': 'hover:bg-brand-accent',
  'hover:bg-blue-700': 'hover:bg-accent-700',
  'hover:text-blue-600': 'hover:text-brand-accent',
  'hover:text-blue-700': 'hover:text-accent-700',
  'hover:text-blue-800': 'hover:text-accent-800',
  'hover:border-blue-600': 'hover:border-brand-accent',
  
  // Gradient from/to
  'from-navy-600': 'from-brand-primary',
  'from-navy-500': 'from-brand-primary',
  'from-navy-400': 'from-primary-400',
  'from-navy-300': 'from-primary-300',
  'from-navy-200': 'from-primary-200',
  'from-navy-100': 'from-primary-100',
  'from-navy-50': 'from-primary-50',
  'to-navy-600': 'to-brand-primary',
  'to-navy-500': 'to-brand-primary',
  'to-navy-400': 'to-primary-400',
  'to-navy-300': 'to-primary-300',
  'to-navy-200': 'to-primary-200',
  'to-navy-100': 'to-primary-100',
  'to-navy-50': 'to-primary-50',
  
  'from-blue-600': 'from-brand-accent',
  'from-blue-500': 'from-accent-500',
  'from-blue-400': 'from-accent-400',
  'from-blue-300': 'from-accent-300',
  'from-blue-200': 'from-accent-200',
  'from-blue-100': 'from-accent-100',
  'from-blue-50': 'from-accent-50',
  'to-blue-600': 'to-brand-accent',
  'to-blue-500': 'to-accent-500',
  'to-blue-400': 'to-accent-400',
  'to-blue-300': 'to-accent-300',
  'to-blue-200': 'to-accent-200',
  'to-blue-100': 'to-accent-100',
  'to-blue-50': 'to-accent-50',
  
  // Via (for gradients)
  'via-navy-600': 'via-brand-primary',
  'via-navy-500': 'via-brand-primary',
  'via-blue-600': 'via-brand-accent',
  'via-blue-500': 'via-accent-500',
  'via-blue-400': 'via-accent-400',
  'via-blue-100': 'via-accent-100',
};

// File extensions to check
const extensions = ['.tsx', '.ts', '.jsx', '.js'];
const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'scripts'];

// Statistics
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  approvedFiles: 0,
  totalReplacements: 0,
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    
    if (excludeDirs.some(dir => filePath.includes(dir))) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      const ext = path.extname(filePath);
      if (extensions.includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function findColorUsages(content) {
  const usages = [];
  
  Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      usages.push({
        old: oldColor,
        new: newColor,
        count: matches.length,
      });
    }
  });
  
  return usages;
}

function applyMigrations(content) {
  let migratedContent = content;
  let totalReplacements = 0;
  const replacements = [];
  
  Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = migratedContent.match(regex);
    if (matches) {
      migratedContent = migratedContent.replace(regex, newColor);
      totalReplacements += matches.length;
      replacements.push({ old: oldColor, new: newColor, count: matches.length });
    }
  });
  
  return { migratedContent, totalReplacements, replacements };
}

function showDiff(original, migrated) {
  const originalLines = original.split('\n');
  const migratedLines = migrated.split('\n');
  const maxLines = Math.max(originalLines.length, migratedLines.length);
  
  console.log('\n📝 CHANGES PREVIEW:');
  console.log('─'.repeat(80));
  
  let changesShown = 0;
  for (let i = 0; i < maxLines && changesShown < 10; i++) {
    const originalLine = originalLines[i] || '';
    const migratedLine = migratedLines[i] || '';
    
    if (originalLine !== migratedLine) {
      console.log(`\nLine ${i + 1}:`);
      console.log(`  - ${originalLine.substring(0, 100)}${originalLine.length > 100 ? '...' : ''}`);
      console.log(`  + ${migratedLine.substring(0, 100)}${migratedLine.length > 100 ? '...' : ''}`);
      changesShown++;
    }
  }
  
  if (changesShown >= 10) {
    console.log(`\n... and more changes (showing first 10)`);
  }
  
  console.log('─'.repeat(80));
}

async function processFile(filePath) {
  stats.totalFiles++;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const usages = findColorUsages(content);
  
  if (usages.length === 0) {
    return; // Skip files with no old colors
  }
  
  const { migratedContent, totalReplacements, replacements } = applyMigrations(content);
  
  if (totalReplacements === 0) {
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`📄 FILE: ${filePath}`);
  console.log('='.repeat(80));
  console.log(`\n🔍 Found ${totalReplacements} color usage(s) to migrate:`);
  
  replacements.forEach(({ old, new: newColor, count }) => {
    console.log(`   ${old} → ${newColor} (${count}x)`);
  });
  
  // Show diff
  showDiff(content, migratedContent);
  
  // Ask for approval
  while (true) {
    const answer = await question(
      `\n❓ Apply changes? [y]es / [n]o / [s]kip / [v]iew full diff / [q]uit: `
    );
    
    const choice = answer.toLowerCase().trim();
    
    if (choice === 'y' || choice === 'yes') {
      // Create backup
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, content);
      
      // Apply changes
      fs.writeFileSync(filePath, migratedContent);
      
      stats.approvedFiles++;
      stats.totalReplacements += totalReplacements;
      console.log(`✅ Changes applied! Backup saved to: ${backupPath}`);
      break;
      
    } else if (choice === 'n' || choice === 'no') {
      console.log(`⏭️  Skipped: ${filePath}`);
      stats.skippedFiles++;
      break;
      
    } else if (choice === 's' || choice === 'skip') {
      console.log(`⏭️  Skipped: ${filePath}`);
      stats.skippedFiles++;
      break;
      
    } else if (choice === 'v' || choice === 'view') {
      // Show full diff using a simple line-by-line comparison
      console.log('\n📋 FULL DIFF:');
      console.log('─'.repeat(80));
      const originalLines = content.split('\n');
      const migratedLines = migratedContent.split('\n');
      
      for (let i = 0; i < Math.max(originalLines.length, migratedLines.length); i++) {
        const originalLine = originalLines[i] || '';
        const migratedLine = migratedLines[i] || '';
        
        if (originalLine !== migratedLine) {
          console.log(`\nLine ${i + 1}:`);
          if (originalLine) console.log(`  - ${originalLine}`);
          if (migratedLine) console.log(`  + ${migratedLine}`);
        }
      }
      console.log('─'.repeat(80));
      // Loop back to ask again
      
    } else if (choice === 'q' || choice === 'quit') {
      console.log('\n🛑 Migration cancelled by user.');
      process.exit(0);
      
    } else {
      console.log('❌ Invalid choice. Please enter y, n, s, v, or q.');
    }
  }
  
  stats.processedFiles++;
}

async function main() {
  console.log('🚀 Color Migration Script');
  console.log('='.repeat(80));
  console.log('\nThis script will:');
  console.log('  1. Find all files with old navy/blue color usage');
  console.log('  2. Show proposed changes for each file');
  console.log('  3. Ask for approval before applying changes');
  console.log('  4. Create backups of all modified files');
  console.log('\n⚠️  Make sure you have committed your work before running this!');
  
  const proceed = await question('\n❓ Continue? [y/n]: ');
  if (proceed.toLowerCase().trim() !== 'y') {
    console.log('Migration cancelled.');
    rl.close();
    return;
  }
  
  console.log('\n🔍 Scanning files...');
  const allFiles = getAllFiles('.');
  console.log(`Found ${allFiles.length} files to check.\n`);
  
  // Process each file
  for (const file of allFiles) {
    await processFile(file);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files checked: ${stats.totalFiles}`);
  console.log(`Files processed: ${stats.processedFiles}`);
  console.log(`Files approved: ${stats.approvedFiles}`);
  console.log(`Files skipped: ${stats.skippedFiles}`);
  console.log(`Total replacements: ${stats.totalReplacements}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Test with default branding');
  console.log('   3. Test with chapter branding');
  console.log('   4. Remove .backup files after confirming everything works');
  console.log('='.repeat(80));
  
  rl.close();
}

// Run the script
main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});