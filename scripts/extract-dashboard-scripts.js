/**
 * Extract Dashboard Scripts
 * 
 * This script extracts and separately saves problematic scripts from the dashboard
 * HTML file to pinpoint the syntax issues.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');
const outputDir = path.join(__dirname, '../tmp');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Extract all script tags
const scriptRegex = /<script(?!\s+src=)[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptIndex = 0;

console.log('Extracting scripts from dashboard.html...');

while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
  const script = match[1];
  
  // Skip empty scripts
  if (!script.trim()) {
    console.log(`Script #${scriptIndex + 1}: Empty, skipping.`);
    scriptIndex++;
    continue;
  }
  
  // Skip very small scripts (likely not the problematic ones)
  if (script.length < 100) {
    console.log(`Script #${scriptIndex + 1}: Too small (${script.length} chars), skipping.`);
    scriptIndex++;
    continue;
  }
  
  console.log(`Found script #${scriptIndex + 1} (${script.length} chars) at position ${match.index}`);
  
  // Write script to a separate file
  const scriptPath = path.join(outputDir, `script_${scriptIndex + 1}.js`);
  fs.writeFileSync(scriptPath, script);
  
  // Try to parse the script with Node to check for syntax errors
  try {
    const vm = require('vm');
    vm.runInNewContext(script, {});
    console.log(`Script #${scriptIndex + 1}: Syntax OK`);
  } catch (error) {
    console.log(`Script #${scriptIndex + 1}: Syntax error - ${error.message}`);
    
    // If this is a "Unexpected token '<'" error, we've found our target
    if (error.message.includes("Unexpected token '<'")) {
      console.log(`FOUND THE PROBLEMATIC SCRIPT: Script #${scriptIndex + 1}`);
      
      // Find the approximate line number in the HTML file
      const lineNumber = dashboardHtml.substring(0, match.index).split('\n').length;
      console.log(`Located around line ${lineNumber} in dashboard.html`);
      
      // Look for the first HTML tag in the script that might be causing the error
      const htmlTagMatch = /<[a-zA-Z][^>]*>/g.exec(script);
      if (htmlTagMatch) {
        console.log(`First HTML tag found: ${htmlTagMatch[0]}`);
        
        // Approximate position in the script
        const scriptLines = script.substring(0, htmlTagMatch.index).split('\n');
        console.log(`Around line ${scriptLines.length} in the script`);
        
        // Context around the HTML tag
        const startContext = Math.max(0, htmlTagMatch.index - 50);
        const endContext = Math.min(script.length, htmlTagMatch.index + htmlTagMatch[0].length + 50);
        console.log('Context:');
        console.log(script.substring(startContext, endContext));
      }
    }
  }
  
  scriptIndex++;
}

console.log(`Extracted ${scriptIndex} scripts in total.`);
console.log(`Check the scripts in the ${outputDir} directory.`);