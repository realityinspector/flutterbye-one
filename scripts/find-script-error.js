/**
 * Find Script Error
 * 
 * This script helps locate JavaScript syntax errors in the dashboard HTML
 * by parsing and checking each script block.
 */

const fs = require('fs');
const path = require('path');

// File to check
const dashboardHtmlPath = path.join(__dirname, '../public/dashboard.html');

// Read the dashboard HTML file
const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');

// Regular expression to find all script tags and their content
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;

console.log('Analyzing dashboard.html for script errors...\n');

let match;
let scriptCount = 0;
let errorFound = false;

while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
  scriptCount++;
  
  // Get the script content
  const scriptContent = match[1];
  
  // Skip empty scripts
  if (!scriptContent.trim()) {
    console.log(`Script #${scriptCount}: Empty script, skipping.`);
    continue;
  }
  
  // Skip scripts that just include external files
  if (match[0].includes('src=')) {
    console.log(`Script #${scriptCount}: External script, skipping analysis.`);
    continue;
  }
  
  console.log(`Checking Script #${scriptCount} (length: ${scriptContent.length} chars)...`);
  
  // Check for HTML-like tags in the script (which could cause Unexpected token '<' errors)
  const htmlTagsInScript = scriptContent.match(/<[a-z][^>]*>/gi);
  if (htmlTagsInScript) {
    console.log(`❌ ERROR: Script #${scriptCount} contains HTML tags that could cause syntax errors:`);
    const firstFewTags = htmlTagsInScript.slice(0, 3);
    console.log(`   First ${firstFewTags.length} tags: ${firstFewTags.join(', ')}`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    errorFound = true;
  }
  
  // Count braces for balance
  const openBraces = (scriptContent.match(/{/g) || []).length;
  const closeBraces = (scriptContent.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.log(`❌ ERROR: Script #${scriptCount} has mismatched braces: ${openBraces} opening vs ${closeBraces} closing`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    errorFound = true;
  }
  
  // Look for unclosed string literals
  const quoteSingleCount = (scriptContent.match(/'/g) || []).length;
  const quoteDoubleCount = (scriptContent.match(/"/g) || []).length;
  const quoteBacktickCount = (scriptContent.match(/`/g) || []).length;
  
  if (quoteSingleCount % 2 !== 0) {
    console.log(`❌ ERROR: Script #${scriptCount} has an odd number of single quotes (${quoteSingleCount}), possibly an unclosed string`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    errorFound = true;
  }
  
  if (quoteDoubleCount % 2 !== 0) {
    console.log(`❌ ERROR: Script #${scriptCount} has an odd number of double quotes (${quoteDoubleCount}), possibly an unclosed string`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    errorFound = true;
  }
  
  if (quoteBacktickCount % 2 !== 0) {
    console.log(`❌ ERROR: Script #${scriptCount} has an odd number of backticks (${quoteBacktickCount}), possibly an unclosed template literal`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    errorFound = true;
  }
  
  // Try to parse the script to see if there are syntax errors
  try {
    new Function(scriptContent);
    console.log(`✅ Script #${scriptCount} has valid JavaScript syntax.`);
  } catch (error) {
    console.log(`❌ ERROR: Script #${scriptCount} has a syntax error: ${error.message}`);
    console.log(`   Script location: Around line ${getLineNumber(dashboardHtml, match.index)}`);
    
    // Show the context of the error if possible
    const errorMatch = error.message.match(/at line (\d+)/);
    if (errorMatch && errorMatch[1]) {
      const errorLine = parseInt(errorMatch[1], 10);
      const lines = scriptContent.split('\n');
      const errorLineContent = lines[errorLine - 1];
      const errorContext = lines.slice(Math.max(0, errorLine - 3), errorLine + 2);
      
      console.log(`   Error context:`);
      errorContext.forEach((line, index) => {
        const lineNumber = Math.max(0, errorLine - 3) + index + 1;
        const marker = lineNumber === errorLine ? '> ' : '  ';
        console.log(`   ${marker}${lineNumber}: ${line}`);
      });
    }
    errorFound = true;
  }
  
  console.log('');
}

console.log(`Analyzed ${scriptCount} script tags in dashboard.html.`);
if (!errorFound) {
  console.log('✅ No obvious JavaScript syntax errors were found.');
}

// Helper function to get line number from character index
function getLineNumber(text, index) {
  const lines = text.substring(0, index).split('\n');
  return lines.length;
}