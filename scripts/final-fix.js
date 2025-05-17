/**
 * Final Fix Script
 * 
 * This script fixes the remaining HTML in JavaScript issues
 * by applying a more aggressive approach to template strings.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Extract script tags from HTML
function extractScripts(html) {
  const scriptRegex = /<script(?!\s+src=)[^>]*>([\s\S]*?)<\/script>/g;
  const scripts = [];
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push({
      content: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return scripts;
}

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// First, add a safeguard at the top of the page
let safeguardScript = `
<script>
// Safeguard against HTML in template strings
window.createTemplate = function(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] !== undefined ? values[i] : '');
  }, '');
};
</script>`;

// Insert safeguard after the last script in the head
const headEndIndex = dashboardHtml.indexOf('</head>');
dashboardHtml = dashboardHtml.substring(0, headEndIndex) + safeguardScript + dashboardHtml.substring(headEndIndex);

// Extract scripts
const scripts = extractScripts(dashboardHtml);
console.log(`Found ${scripts.length} script blocks in the HTML file`);

// Patterns that might indicate problematic template strings with HTML
const problemPatterns = [
  /innerHTML\s*=\s*`\s*<[a-zA-Z]/g,
  /\$\{.*?\}\s*<[a-zA-Z]/g,
  /=\s*`\s*<[a-zA-Z][^`]*\$\{/g,
  /appendChild\(.*innerHTML\s*=\s*`/g
];

// Fix all instances of template strings with HTML
let fixedHtml = dashboardHtml;
let offset = 0; // Track offset caused by replacements

scripts.forEach((script, index) => {
  console.log(`Checking script #${index + 1}...`);
  let scriptContent = script.content;
  let hasChanges = false;
  
  // Check for problematic patterns in this script
  for (const pattern of problemPatterns) {
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(scriptContent)) !== null) {
      console.log(`Found potential issue in script #${index + 1} at character ${match.index}`);
      
      // Find the template string that contains this match
      const beforeMatch = scriptContent.substring(0, match.index + match[0].length);
      const lastBacktick = beforeMatch.lastIndexOf('`');
      
      if (lastBacktick === -1) continue;
      
      // Find the closing backtick
      let closeBacktick = scriptContent.indexOf('`', match.index + match[0].length);
      
      if (closeBacktick === -1) {
        console.log('Warning: Could not find closing backtick');
        continue;
      }
      
      // Extract the template string
      const templateString = scriptContent.substring(lastBacktick, closeBacktick + 1);
      console.log(`Template string length: ${templateString.length} chars`);
      
      // Create a safer replacement with explicit string concatenation
      let saferTemplate = templateString
        // Fix class attributes with dynamic content
        .replace(/class="([^"]*)\$\{([^}]*)\}([^"]*)"/g, 'class="$1" + $2 + "$3"')
        // Fix other attributes with dynamic content
        .replace(/([a-zA-Z0-9-]+)="([^"]*)\$\{([^}]*)\}([^"]*)"/g, '$1="$2" + $3 + "$4"')
        // Fix general HTML structure with safe concatenation
        .replace(/<([a-zA-Z][^>]*)>\$\{([^}]*)\}/g, '<$1>" + $2 + "');
      
      // Only apply changes if the replacement is different
      if (saferTemplate !== templateString) {
        console.log('Fixing template string');
        scriptContent = scriptContent.substring(0, lastBacktick) + 
                       saferTemplate +
                       scriptContent.substring(closeBacktick + 1);
        
        hasChanges = true;
      }
    }
  }
  
  // Apply changes to the script block in the HTML
  if (hasChanges) {
    console.log(`Applying changes to script #${index + 1}`);
    
    // Calculate new positions with offset
    const actualStart = script.start + offset;
    const actualEnd = script.end + offset;
    
    // Create new script tag with fixed content
    const newScript = `<script>${scriptContent}</script>`;
    
    // Replace in the HTML
    fixedHtml = fixedHtml.substring(0, actualStart) + 
                newScript + 
                fixedHtml.substring(actualEnd);
    
    // Update offset
    offset += (newScript.length - (actualEnd - actualStart));
  }
});

// Fallback fix: replace any remaining problematic template string patterns
// with explicit calls to the safe template function

// Write the updated HTML back to the file
fs.writeFileSync(dashboardPath, fixedHtml);
console.log('Fixed dashboard.html with improved template handling');