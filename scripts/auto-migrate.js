const fs = require('fs');
const path = require('path');

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
  
  // Directional borders - MISSING VARIANTS ADDED
  'border-t-navy-600': 'border-t-brand-primary',
  'border-t-navy-700': 'border-t-brand-primary-hover',
  'border-t-navy-500': 'border-t-brand-primary',
  'border-t-navy-900': 'border-t-primary-900',
  'border-t-navy-800': 'border-t-primary-800',
  'border-t-navy-400': 'border-t-primary-400',
  'border-t-navy-300': 'border-t-primary-300',
  'border-t-navy-200': 'border-t-primary-200',
  'border-t-navy-100': 'border-t-primary-100',
  'border-t-navy-50': 'border-t-primary-50',
  
  'border-b-navy-600': 'border-b-brand-primary',
  'border-b-navy-700': 'border-b-brand-primary-hover',
  'border-b-navy-500': 'border-b-brand-primary',
  'border-b-navy-900': 'border-b-primary-900',
  'border-b-navy-800': 'border-b-primary-800',
  'border-b-navy-400': 'border-b-primary-400',
  'border-b-navy-300': 'border-b-primary-300',
  'border-b-navy-200': 'border-b-primary-200',
  'border-b-navy-100': 'border-b-primary-100',
  'border-b-navy-50': 'border-b-primary-50',
  
  'border-l-navy-600': 'border-l-brand-primary',
  'border-l-navy-700': 'border-l-brand-primary-hover',
  'border-l-navy-500': 'border-l-brand-primary',
  'border-l-navy-900': 'border-l-primary-900',
  'border-l-navy-800': 'border-l-primary-800',
  'border-l-navy-400': 'border-l-primary-400',
  'border-l-navy-300': 'border-l-primary-300',
  'border-l-navy-200': 'border-l-primary-200',
  'border-l-navy-100': 'border-l-primary-100',
  'border-l-navy-50': 'border-l-primary-50',
  
  'border-r-navy-600': 'border-r-brand-primary',
  'border-r-navy-700': 'border-r-brand-primary-hover',
  'border-r-navy-500': 'border-r-brand-primary',
  'border-r-navy-900': 'border-r-primary-900',
  'border-r-navy-800': 'border-r-primary-800',
  'border-r-navy-400': 'border-r-primary-400',
  'border-r-navy-300': 'border-r-primary-300',
  'border-r-navy-200': 'border-r-primary-200',
  'border-r-navy-100': 'border-r-primary-100',
  'border-r-navy-50': 'border-r-primary-50',
  
  // Ring variants (not just focus:ring-)
  'ring-navy-600': 'ring-brand-primary',
  'ring-navy-700': 'ring-brand-primary-hover',
  'ring-navy-500': 'ring-brand-primary',
  'ring-navy-900': 'ring-primary-900',
  'ring-navy-800': 'ring-primary-800',
  'ring-navy-400': 'ring-primary-400',
  'ring-navy-300': 'ring-primary-300',
  'ring-navy-200': 'ring-primary-200',
  'ring-navy-100': 'ring-primary-100',
  'ring-navy-50': 'ring-primary-50',
  
  // Focus states - use brand for chapter branding
  'focus:border-navy-500': 'focus:border-brand-primary',
  'focus:border-navy-600': 'focus:border-brand-primary',
  'focus:ring-navy-500': 'focus:ring-brand-primary',
  'focus:ring-navy-600': 'focus:ring-brand-primary',
  'focus:border-t-navy-500': 'focus:border-t-brand-primary',
  'focus:border-t-navy-600': 'focus:border-t-brand-primary',
  'focus:border-b-navy-500': 'focus:border-b-brand-primary',
  'focus:border-b-navy-600': 'focus:border-b-brand-primary',
  'focus:border-l-navy-500': 'focus:border-l-brand-primary',
  'focus:border-l-navy-600': 'focus:border-l-brand-primary',
  'focus:border-r-navy-500': 'focus:border-r-brand-primary',
  'focus:border-r-navy-600': 'focus:border-r-brand-primary',
  
  // Blue to Accent (for brand-related blues - supports chapter branding)
  'bg-blue-600': 'bg-brand-accent',
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
  
  // Directional borders for blue
  'border-t-blue-600': 'border-t-brand-accent',
  'border-t-blue-500': 'border-t-accent-500',
  'border-t-blue-700': 'border-t-accent-700',
  'border-t-blue-800': 'border-t-accent-800',
  'border-t-blue-200': 'border-t-accent-200',
  'border-t-blue-100': 'border-t-accent-100',
  
  'border-b-blue-600': 'border-b-brand-accent',
  'border-b-blue-500': 'border-b-accent-500',
  'border-b-blue-700': 'border-b-accent-700',
  'border-b-blue-800': 'border-b-accent-800',
  'border-b-blue-200': 'border-b-accent-200',
  'border-b-blue-100': 'border-b-accent-100',
  
  'border-l-blue-600': 'border-l-brand-accent',
  'border-l-blue-500': 'border-l-accent-500',
  'border-l-blue-700': 'border-l-accent-700',
  'border-l-blue-800': 'border-l-accent-800',
  'border-l-blue-200': 'border-l-accent-200',
  'border-l-blue-100': 'border-l-accent-100',
  
  'border-r-blue-600': 'border-r-brand-accent',
  'border-r-blue-500': 'border-r-accent-500',
  'border-r-blue-700': 'border-r-accent-700',
  'border-r-blue-800': 'border-r-accent-800',
  'border-r-blue-200': 'border-r-accent-200',
  'border-r-blue-100': 'border-r-accent-100',
  
  // Ring variants for blue
  'ring-blue-600': 'ring-brand-accent',
  'ring-blue-500': 'ring-accent-500',
  'ring-blue-700': 'ring-accent-700',
  'ring-blue-800': 'ring-accent-800',
  'ring-blue-200': 'ring-accent-200',
  'ring-blue-100': 'ring-accent-100',
  
  'focus:border-blue-500': 'focus:border-brand-accent',
  'focus:border-blue-600': 'focus:border-brand-accent',
  'focus:ring-blue-500': 'focus:ring-brand-accent',
  'focus:ring-blue-600': 'focus:ring-brand-accent',
  'focus:border-t-blue-500': 'focus:border-t-brand-accent',
  'focus:border-t-blue-600': 'focus:border-t-brand-accent',
  'focus:border-b-blue-500': 'focus:border-b-brand-accent',
  'focus:border-b-blue-600': 'focus:border-b-brand-accent',
  'focus:border-l-blue-500': 'focus:border-l-brand-accent',
  'focus:border-l-blue-600': 'focus:border-l-brand-accent',
  'focus:border-r-blue-500': 'focus:border-r-brand-accent',
  'focus:border-r-blue-600': 'focus:border-r-brand-accent',
  
  // Hover states
  'hover:bg-navy-600': 'hover:bg-brand-primary',
  'hover:bg-navy-700': 'hover:bg-brand-primary-hover',
  'hover:bg-navy-50': 'hover:bg-primary-50',
  'hover:bg-navy-100': 'hover:bg-primary-100',
  'hover:text-navy-600': 'hover:text-brand-primary',
  'hover:text-navy-700': 'hover:text-brand-primary-hover',
  'hover:text-navy-900': 'hover:text-primary-900',
  'hover:border-navy-600': 'hover:border-brand-primary',
  'hover:border-t-navy-600': 'hover:border-t-brand-primary',
  'hover:border-b-navy-600': 'hover:border-b-brand-primary',
  'hover:border-l-navy-600': 'hover:border-l-brand-primary',
  'hover:border-r-navy-600': 'hover:border-r-brand-primary',
  
  'hover:bg-blue-600': 'hover:bg-brand-accent',
  'hover:bg-blue-700': 'hover:bg-accent-700',
  'hover:text-blue-600': 'hover:text-brand-accent',
  'hover:text-blue-700': 'hover:text-accent-700',
  'hover:text-blue-800': 'hover:text-accent-800',
  'hover:border-blue-600': 'hover:border-brand-accent',
  'hover:border-t-blue-600': 'hover:border-t-brand-accent',
  'hover:border-b-blue-600': 'hover:border-b-brand-accent',
  'hover:border-l-blue-600': 'hover:border-l-brand-accent',
  'hover:border-r-blue-600': 'hover:border-r-brand-accent',
  
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
  
  // Hardcoded hex colors (replace with brand variables or new colors)
  '#2346e0': 'var(--brand-primary)', // navy-600
  '#4568ff': 'var(--brand-accent)',   // navy-500 / accent
  '#7090ff': 'var(--brand-accent-light)', // navy-400
  '#1833b5': 'var(--brand-primary-hover)', // navy-700
  '#102288': '#333333', // navy-800 -> primary-800 equivalent
  '#0b1965': '#1a1a1a', // navy-900 -> primary-900 equivalent
};

// Statistics
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  errorFiles: 0,
  totalReplacements: 0,
  filesProcessed: [],
  filesSkipped: [],
  filesWithErrors: [],
};

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

function processFile(filePath) {
  stats.totalFiles++;
  
  try {
    // Normalize path separators (handle Windows backslashes)
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    if (!fs.existsSync(normalizedPath)) {
      console.log(`⚠️  File not found: ${normalizedPath}`);
      stats.skippedFiles++;
      stats.filesSkipped.push({ file: normalizedPath, reason: 'File not found' });
      return;
    }
    
    const content = fs.readFileSync(normalizedPath, 'utf8');
    const { migratedContent, totalReplacements, replacements } = applyMigrations(content);
    
    if (totalReplacements === 0) {
      console.log(`⏭️  ${normalizedPath}: No changes needed`);
      stats.skippedFiles++;
      stats.filesSkipped.push({ file: normalizedPath, reason: 'No changes needed' });
      return;
    }
    
    // Create backup
    const backupPath = `${normalizedPath}.backup`;
    fs.writeFileSync(backupPath, content);
    
    // Apply changes
    fs.writeFileSync(normalizedPath, migratedContent);
    
    stats.processedFiles++;
    stats.totalReplacements += totalReplacements;
    
    console.log(`✅ ${normalizedPath}: ${totalReplacements} replacement(s)`);
    replacements.forEach(({ old, new: newColor, count }) => {
      console.log(`   ${old} → ${newColor} (${count}x)`);
    });
    
    stats.filesProcessed.push({
      file: normalizedPath,
      replacements: totalReplacements,
      changes: replacements,
    });
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    stats.errorFiles++;
    stats.filesWithErrors.push({ file: filePath, error: error.message });
  }
}

function main() {
  console.log('🚀 Automated Color Migration Script (Updated)');
  console.log('='.repeat(80));
  
  // Check if migration-status.json exists
  const statusFile = 'migration-status.json';
  if (!fs.existsSync(statusFile)) {
    console.error(`❌ Error: ${statusFile} not found!`);
    console.log('💡 Please run check-migration-status.js first to generate the status file.');
    process.exit(1);
  }
  
  // Load migration status
  let migrationStatus;
  try {
    const statusContent = fs.readFileSync(statusFile, 'utf8');
    migrationStatus = JSON.parse(statusContent);
  } catch (error) {
    console.error(`❌ Error reading ${statusFile}:`, error.message);
    process.exit(1);
  }
  
  const filesNeedingUpdate = migrationStatus.filesNeedingUpdate || [];
  
  if (filesNeedingUpdate.length === 0) {
    console.log('🎉 No files need updating! All files are already migrated.');
    return;
  }
  
  console.log(`\n📋 Found ${filesNeedingUpdate.length} files needing updates`);
  console.log(`📊 Original stats: ${JSON.stringify(migrationStatus.stats, null, 2)}`);
  console.log('\n⚠️  This will automatically update all files listed in migration-status.json');
  console.log('💾 Backups will be created with .backup extension');
  console.log('🆕 Updated to include directional borders (border-t-, border-b-, etc.) and ring variants\n');
  
  // Process each file
  console.log('🔄 Starting migration...\n');
  
  filesNeedingUpdate.forEach((fileInfo, index) => {
    const filePath = fileInfo.file;
    console.log(`[${index + 1}/${filesNeedingUpdate.length}] Processing: ${filePath}`);
    processFile(filePath);
  });
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files processed: ${stats.totalFiles}`);
  console.log(`✅ Files updated: ${stats.processedFiles}`);
  console.log(`⏭️  Files skipped: ${stats.skippedFiles}`);
  console.log(`❌ Files with errors: ${stats.errorFiles}`);
  console.log(`🔄 Total replacements: ${stats.totalReplacements}`);
  
  if (stats.filesProcessed.length > 0) {
    console.log('\n📝 Files updated:');
    stats.filesProcessed.slice(0, 10).forEach(({ file, replacements }) => {
      console.log(`   ✅ ${file} (${replacements} replacements)`);
    });
    if (stats.filesProcessed.length > 10) {
      console.log(`   ... and ${stats.filesProcessed.length - 10} more files`);
    }
  }
  
  if (stats.filesSkipped.length > 0) {
    console.log('\n⏭️  Files skipped:');
    stats.filesSkipped.slice(0, 5).forEach(({ file, reason }) => {
      console.log(`   ⏭️  ${file} (${reason})`);
    });
    if (stats.filesSkipped.length > 5) {
      console.log(`   ... and ${stats.filesSkipped.length - 5} more files`);
    }
  }
  
  if (stats.filesWithErrors.length > 0) {
    console.log('\n❌ Files with errors:');
    stats.filesWithErrors.forEach(({ file, error }) => {
      console.log(`   ❌ ${file}: ${error}`);
    });
  }
  
  // Save migration report
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    filesProcessed: stats.filesProcessed,
    filesSkipped: stats.filesSkipped,
    filesWithErrors: stats.filesWithErrors,
  };
  
  fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to: migration-report.json');
  
  console.log('\n💡 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Test with default branding');
  console.log('   3. Test with chapter branding');
  console.log('   4. Remove .backup files after confirming everything works');
  console.log('   5. Run check-migration-status.js again to verify all files are migrated');
  console.log('='.repeat(80));
}

// Run the script
main();