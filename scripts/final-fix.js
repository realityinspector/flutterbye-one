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

// Read the file
console.log('Reading dashboard.html...');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Function to extract script tags
function extractScripts(html) {
  const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  const scripts = [];
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    // Skip scripts with src attribute
    if (!match[0].includes(' src=')) {
      scripts.push({
        fullMatch: match[0],
        content: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  return scripts;
}

// Extract all scripts from the HTML file
const scripts = extractScripts(dashboardContent);
console.log(`Found ${scripts.length} script tags without src attribute`);

// Process each script to fix HTML in template strings
let modifiedContent = dashboardContent;
let offset = 0;

for (let i = 0; i < scripts.length; i++) {
  const script = scripts[i];
  let content = script.content;
  
  // Skip very small scripts
  if (content.trim().length < 10) continue;
  
  console.log(`Checking script #${i+1} (${content.length} chars)`);
  
  // Check for HTML tags within the script content
  if (content.includes('<div') || content.includes('<span') || content.includes('<p>')) {
    // Look for HTML in template strings
    const templateRegex = /`([\s\S]*?)`/g;
    let templateMatch;
    let newContent = content;
    let templateFixes = 0;
    
    while ((templateMatch = templateRegex.exec(content)) !== null) {
      const template = templateMatch[1];
      
      // Check if the template contains HTML tags
      if (template.includes('<div') || template.includes('<span') || template.includes('<p>')) {
        // Replace problematic HTML constructs in template strings
        const fixedTemplate = template
          // Fix class attributes with template expressions
          .replace(/class="([^"]*)(\${[^}]*})([^"]*)"/g, 'class="\$1"+"$2"+"\$3"')
          // Fix id attributes with template expressions
          .replace(/id="([^"]*)(\${[^}]*})([^"]*)"/g, 'id="\$1"+"$2"+"\$3"')
          // Fix style attributes with template expressions
          .replace(/style="([^"]*)(\${[^}]*})([^"]*)"/g, 'style="\$1"+"$2"+"\$3"');
        
        if (template !== fixedTemplate) {
          const startPos = templateMatch.index + 1; // +1 to skip the backtick
          const endPos = startPos + template.length;
          
          // Replace the template content with the fixed version
          newContent = newContent.substring(0, startPos) + 
                      fixedTemplate + 
                      newContent.substring(endPos);
          
          templateFixes++;
        }
      }
    }
    
    if (templateFixes > 0) {
      console.log(`Fixed ${templateFixes} template strings in script #${i+1}`);
      
      // Update the script in the document
      const fullScript = script.fullMatch;
      const newScript = fullScript.replace(content, newContent);
      
      // Calculate the adjusted position accounting for previous edits
      const actualStartIndex = script.startIndex + offset;
      
      // Update the document content
      modifiedContent = modifiedContent.substring(0, actualStartIndex) + 
                       newScript + 
                       modifiedContent.substring(actualStartIndex + fullScript.length);
      
      // Update the offset for subsequent scripts
      offset += (newScript.length - fullScript.length);
    }
    
    // Check for unclosed template literals
    let backtickCount = (newContent.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      console.log(`Found odd number of backticks (${backtickCount}) in script #${i+1}`);
      
      // Find the position of the last backtick
      const lastBacktickPos = newContent.lastIndexOf('`');
      
      // Determine if we need to add an opening or closing backtick
      if (lastBacktickPos !== -1) {
        // Count backticks up to this position
        const precedingBackticks = (newContent.substring(0, lastBacktickPos).match(/`/g) || []).length;
        
        // If odd, we need to add a closing backtick
        if (precedingBackticks % 2 === 0) {
          // Add a closing backtick at the end
          newContent += '`';
        } else {
          // Add an opening backtick at the beginning of the nearest statement
          const nearestSemicolon = newContent.lastIndexOf(';', lastBacktickPos);
          if (nearestSemicolon !== -1) {
            newContent = newContent.substring(0, nearestSemicolon + 1) + 
                        '`' + 
                        newContent.substring(nearestSemicolon + 1);
          } else {
            // Just add at the beginning as a fallback
            newContent = '`' + newContent;
          }
        }
        
        console.log('Fixed unclosed template literal');
        
        // Update the script in the document
        const fullScript = script.fullMatch;
        const newScript = fullScript.replace(content, newContent);
        
        // Calculate the adjusted position accounting for previous edits
        const actualStartIndex = script.startIndex + offset;
        
        // Update the document content
        modifiedContent = modifiedContent.substring(0, actualStartIndex) + 
                         newScript + 
                         modifiedContent.substring(actualStartIndex + fullScript.length);
        
        // Update the offset for subsequent scripts
        offset += (newScript.length - fullScript.length);
      }
    }
  }
}

// Save the modified content if changes were made
if (modifiedContent !== dashboardContent) {
  fs.writeFileSync(dashboardPath, modifiedContent);
  console.log('Saved changes to dashboard.html');
} else {
  console.log('No changes were needed');
}

console.log('Script completed');