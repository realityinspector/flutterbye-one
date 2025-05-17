/**
 * Find Script Error
 * 
 * This script helps locate JavaScript syntax errors in the dashboard HTML
 * by parsing and checking each script block.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Function to get line number from character index
function getLineNumber(text, index) {
  return text.substring(0, index).split('\n').length;
}

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Use JSDOM to parse the HTML (lightweight alternative to cheerio)
const dom = new JSDOM(dashboardHtml);
const document = dom.window.document;

// Get all script tags
const scriptTags = document.querySelectorAll('script:not([src])');
console.log(`Found ${scriptTags.length} inline script tags`);

// Examine each script
scriptTags.forEach((script, index) => {
  const scriptContent = script.textContent;
  if (!scriptContent.trim()) {
    console.log(`Script #${index + 1}: Empty script, skipping`);
    return;
  }
  
  console.log(`\nScript #${index + 1} (${scriptContent.length} chars):`);
  console.log('Preview:', scriptContent.substring(0, 100).replace(/\n/g, ' ').trim() + '...');
  
  // Try evaluating the script
  try {
    // Use Function constructor to check syntax without executing
    new Function(scriptContent);
    console.log(`Script #${index + 1}: No syntax errors detected`);
  } catch (error) {
    console.error(`Script #${index + 1}: SYNTAX ERROR - ${error.message}`);
    
    // Try to locate the problematic area in the script
    if (error.message.includes("Unexpected token '<'")) {
      console.log('ERROR TYPE: Unexpected token "<" - Likely HTML in JavaScript string');
      
      // Find HTML tag in the script content
      const htmlTagMatch = /<[a-zA-Z][^>]*>/g.exec(scriptContent);
      if (htmlTagMatch) {
        const positionInScript = htmlTagMatch.index;
        console.log(`First HTML tag found at position ${positionInScript} in script: ${htmlTagMatch[0]}`);
        
        // Show context around the error
        const errorContext = scriptContent.substring(
          Math.max(0, positionInScript - 50),
          Math.min(scriptContent.length, positionInScript + 150)
        );
        console.log('Error context:');
        console.log(errorContext);
        
        // Find the line in the original HTML file
        const scriptStart = dashboardHtml.indexOf(scriptContent);
        if (scriptStart !== -1) {
          const absolutePosition = scriptStart + positionInScript;
          const lineNumber = getLineNumber(dashboardHtml, absolutePosition);
          console.log(`Error is around line ${lineNumber} in dashboard.html`);
          
          // Generate a replacement that avoids the syntax error
          const beforeTag = scriptContent.substring(0, positionInScript);
          const lastBacktick = beforeTag.lastIndexOf('`');
          const lastSingleQuote = beforeTag.lastIndexOf("'");
          const lastDoubleQuote = beforeTag.lastIndexOf('"');
          
          if (lastBacktick !== -1 && lastBacktick > Math.max(lastSingleQuote, lastDoubleQuote)) {
            console.log('This appears to be a template literal with HTML inside');
            // More detailed fixes would need to be applied in a separate script
          }
        }
      }
    }
  }
});

console.log('\nScript analysis complete.');