const fs = require('fs');
const path = require('path');

// Color patterns to search for
const colorPatterns = {
  navy: /navy-\d{2,3}/g,
  blue: /blue-\d{2,3}/g,
  hardcodedNavy: /#2346e0|#4568ff|#7090ff|#1833b5|#102288|#0b1965/g,
};

// File extensions to check
const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css'];
const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'scripts'];

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

function hasOldColors(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasNavy = colorPatterns.navy.test(content);
  const hasBlue = colorPatterns.blue.test(content);
  const hasHardcoded = colorPatterns.hardcodedNavy.test(content);
  
  // Reset regex lastIndex
  colorPatterns.navy.lastIndex = 0;
  colorPatterns.blue.lastIndex = 0;
  colorPatterns.hardcodedNavy.lastIndex = 0;
  
  return {
    hasIssues: hasNavy || hasBlue || hasHardcoded,
    hasNavy,
    hasBlue,
    hasHardcoded,
  };
}

function main() {
  console.log('🔍 Scanning for files with old color usage...\n');
  
  const allFiles = getAllFiles('.');
  const filesNeedingUpdate = [];
  const stats = {
    totalFiles: allFiles.length,
    filesWithNavy: 0,
    filesWithBlue: 0,
    filesWithHardcoded: 0,
    totalNavyUsages: 0,
    totalBlueUsages: 0,
    totalHardcodedUsages: 0,
  };
  
  allFiles.forEach((file) => {
    const result = hasOldColors(file);
    
    if (result.hasIssues) {
      filesNeedingUpdate.push({
        file,
        ...result,
      });
      
      if (result.hasNavy) stats.filesWithNavy++;
      if (result.hasBlue) stats.filesWithBlue++;
      if (result.hasHardcoded) stats.filesWithHardcoded++;
      
      // Count actual usages
      const content = fs.readFileSync(file, 'utf8');
      const navyMatches = content.match(colorPatterns.navy);
      const blueMatches = content.match(colorPatterns.blue);
      const hardcodedMatches = content.match(colorPatterns.hardcodedNavy);
      
      if (navyMatches) stats.totalNavyUsages += navyMatches.length;
      if (blueMatches) stats.totalBlueUsages += blueMatches.length;
      if (hardcodedMatches) stats.totalHardcodedUsages += hardcodedMatches.length;
      
      // Reset regex
      colorPatterns.navy.lastIndex = 0;
      colorPatterns.blue.lastIndex = 0;
      colorPatterns.hardcodedNavy.lastIndex = 0;
    }
  });
  
  // Display results
  console.log('='.repeat(80));
  console.log('📊 COLOR MIGRATION STATUS');
  console.log('='.repeat(80));
  console.log(`\n📁 Total files scanned: ${stats.totalFiles}`);
  console.log(`\n⚠️  Files needing updates: ${filesNeedingUpdate.length}`);
  console.log(`   ├─ Files with navy colors: ${stats.filesWithNavy}`);
  console.log(`   ├─ Files with blue colors: ${stats.filesWithBlue}`);
  console.log(`   └─ Files with hardcoded hex: ${stats.filesWithHardcoded}`);
  console.log(`\n📈 Total color usages found:`);
  console.log(`   ├─ Navy usages: ${stats.totalNavyUsages}`);
  console.log(`   ├─ Blue usages: ${stats.totalBlueUsages}`);
  console.log(`   └─ Hardcoded hex: ${stats.totalHardcodedUsages}`);
  console.log(`\n✅ Files already migrated: ${stats.totalFiles - filesNeedingUpdate.length}`);
  console.log(`\n📊 Migration progress: ${Math.round(((stats.totalFiles - filesNeedingUpdate.length) / stats.totalFiles) * 100)}%`);
  
  if (filesNeedingUpdate.length > 0) {
    console.log('\n📋 Files still needing updates:');
    console.log('─'.repeat(80));
    
    // Show top 20 files
    const topFiles = filesNeedingUpdate.slice(0, 20);
    topFiles.forEach((file, index) => {
      const issues = [];
      if (file.hasNavy) issues.push('navy');
      if (file.hasBlue) issues.push('blue');
      if (file.hasHardcoded) issues.push('hex');
      console.log(`   ${index + 1}. ${file.file}`);
      console.log(`      Issues: ${issues.join(', ')}`);
    });
    
    if (filesNeedingUpdate.length > 20) {
      console.log(`\n   ... and ${filesNeedingUpdate.length - 20} more files`);
    }
  } else {
    console.log('\n🎉 All files have been migrated!');
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Export summary to JSON
  const summary = {
    timestamp: new Date().toISOString(),
    stats,
    filesNeedingUpdate: filesNeedingUpdate.map(f => ({
      file: f.file,
      hasNavy: f.hasNavy,
      hasBlue: f.hasBlue,
      hasHardcoded: f.hasHardcoded,
    })),
  };
  
  fs.writeFileSync('migration-status.json', JSON.stringify(summary, null, 2));
  console.log('💾 Detailed status saved to: migration-status.json');
}

main();