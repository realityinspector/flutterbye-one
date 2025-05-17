/**
 * Fix Template Strings
 * 
 * This script fixes HTML template strings in the dashboard.html file
 * that are causing JavaScript syntax errors
 */

const fs = require('fs');
const path = require('path');

// Read the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');
const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

console.log('Fixing template strings in dashboard.html...');

// Split the file by script tags to isolate the problematic script
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
let match;
let updatedHtml = dashboardHtml;
let fixes = 0;

while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
  // Skip scripts with src attribute
  if (match[0].includes('src=')) {
    continue;
  }
  
  const scriptContent = match[1];
  const scriptStartPos = match.index + match[0].indexOf('>') + 1;
  const scriptEndPos = scriptStartPos + scriptContent.length;
  
  // Check if this script has template strings with HTML
  if (scriptContent.includes('`') && scriptContent.includes('<div')) {
    console.log('Found a script with potential template string issues');
    
    // Extract the problematic script
    let updatedScript = scriptContent;
    
    // Fix 1: Check for unclosed template strings
    let inBacktick = false;
    let unclosedPos = -1;
    
    for (let i = 0; i < updatedScript.length; i++) {
      if (updatedScript[i] === '`' && (i === 0 || updatedScript[i-1] !== '\\')) {
        if (inBacktick) {
          inBacktick = false;
          unclosedPos = -1;
        } else {
          inBacktick = true;
          unclosedPos = i;
        }
      }
      
      // If we're in a backtick and find HTML comment start, this could be problematic
      if (inBacktick && 
          i < updatedScript.length - 3 && 
          updatedScript.substring(i, i+4) === '<!--') {
        console.log('Found potentially problematic HTML comment in template string');
      }
    }
    
    if (inBacktick && unclosedPos >= 0) {
      console.log('Found unclosed template string at position', unclosedPos);
      // Add closing backtick at the end of the script
      updatedScript += '`';
      fixes++;
    }
    
    // Fix 2: Replace problematic template strings
    // Look for template strings with unescaped ${ inside HTML attributes
    const attrRegex = /class="[^"]*\${[^}]*}[^"]*"/g;
    let match;
    while ((match = attrRegex.exec(updatedScript)) !== null) {
      const original = match[0];
      // Replace ${...} with properly escaped version in HTML attributes
      const fixed = original.replace(/\${([^}]*)}/g, '"+($1)+"');
      
      if (original !== fixed) {
        console.log('Fixing template string in HTML attribute:', original);
        // Only replace this specific instance
        updatedScript = updatedScript.substring(0, match.index) + 
                       fixed + 
                       updatedScript.substring(match.index + original.length);
        fixes++;
      }
    }
    
    // Fix 3: Check for missing closing braces in the script
    const openBraces = (updatedScript.match(/{/g) || []).length;
    const closeBraces = (updatedScript.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      console.log(`Adding ${openBraces - closeBraces} missing closing braces`);
      updatedScript += '}'.repeat(openBraces - closeBraces);
      fixes++;
    }
    
    // Update the script in the HTML
    if (updatedScript !== scriptContent) {
      updatedHtml = updatedHtml.substring(0, scriptStartPos) + 
                 updatedScript + 
                 updatedHtml.substring(scriptEndPos);
      
      // Update regex's lastIndex to account for any length changes
      const lengthDiff = updatedScript.length - scriptContent.length;
      scriptRegex.lastIndex += lengthDiff;
    }
  }
}

// Check if any fixes were made
if (fixes > 0) {
  // Write the updated HTML back to the file
  fs.writeFileSync(dashboardPath, updatedHtml);
  console.log(`Applied ${fixes} fixes to dashboard.html`);
} else {
  console.log('No template string issues found to fix');
}

console.log('Script completed');