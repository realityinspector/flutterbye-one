/**
 * Fix Notification Template Script
 * 
 * This script specifically targets and fixes the problematic template string
 * in the notification function that's causing the "Unexpected token '<'" error.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Look for the problematic notification template
const problemPattern = /notification\.innerHTML\s*=\s*`\s*<div class="notification-icon">/;
const match = problemPattern.exec(dashboardHtml);

if (!match) {
  console.log('Could not find the problematic notification template.');
  process.exit(1);
}

console.log('Found problematic template at position:', match.index);

// Find the start and end of the template string
const templateStart = dashboardHtml.lastIndexOf('`', match.index + match[0].length);
let templateEnd = dashboardHtml.indexOf('`', templateStart + 1);

// If the ending backtick isn't found, this is part of the problem
if (templateEnd === -1) {
  console.log('Template string is not properly closed. This is part of the issue.');
  
  // Find a reasonable place to end the template (first semicolon or closing brace after the start)
  const semicolonEnd = dashboardHtml.indexOf(';', templateStart);
  const braceEnd = dashboardHtml.indexOf('}', templateStart);
  
  if (semicolonEnd !== -1 && (braceEnd === -1 || semicolonEnd < braceEnd)) {
    templateEnd = semicolonEnd;
  } else if (braceEnd !== -1) {
    templateEnd = braceEnd;
  } else {
    // Fallback: just use a reasonable number of characters
    templateEnd = templateStart + 300;
  }
}

// Extract the template string context
const templateContext = dashboardHtml.substring(
  Math.max(0, templateStart - 100), 
  Math.min(dashboardHtml.length, templateEnd + 100)
);

console.log('Template context:');
console.log(templateContext);

// Create the fixed version by replacing the problematic template with a function call
let updatedHtml = dashboardHtml.substring(0, templateStart - 1) + // -1 to exclude the backtick
                "notification.innerHTML = renderNotificationTemplate(title, message, icon, type);" +
                dashboardHtml.substring(templateEnd + 1); // +1 to exclude the backtick

// Write the updated HTML back to the file
fs.writeFileSync(dashboardPath, updatedHtml);
console.log('Fixed notification template in dashboard.html');

// Now check for any other problematic templates
const otherTemplatePattern = /innerHTML\s*=\s*`\s*<[a-zA-Z]/g;
let otherFixes = 0;
let currentMatch;

// Create a modified HTML to avoid changing positions as we modify
let modifiedHtml = updatedHtml;

// Find and fix other problematic templates
while ((currentMatch = otherTemplatePattern.exec(updatedHtml)) !== null) {
  const matchPos = currentMatch.index;
  console.log(`Found another potential template issue at position ${matchPos}`);
  
  // Extract this template context
  const matchStart = updatedHtml.lastIndexOf('`', matchPos + currentMatch[0].length);
  let matchEnd = updatedHtml.indexOf('`', matchStart + 1);
  
  if (matchEnd === -1) {
    console.log('Another unclosed template found - skipping');
    continue;
  }
  
  const templateString = updatedHtml.substring(matchStart, matchEnd + 1);
  console.log(`Template size: ${templateString.length} chars`);
  
  // Only fix smaller templates to avoid breaking complex ones
  if (templateString.length > 500) {
    console.log('Template too complex, skipping');
    continue;
  }
  
  // Fix this template by escaping HTML properly
  let fixedTemplate = templateString
    .replace(/class="([^"]*)(\${[^}]*})([^"]*)"/g, 'class="\$1"+"$2"+"\$3"');
  
  if (fixedTemplate !== templateString) {
    console.log('Fixed another template with dynamic class attribute');
    
    // Update in our modified HTML (adjust for position changes)
    const actualPos = updatedHtml.indexOf(templateString);
    modifiedHtml = modifiedHtml.substring(0, actualPos) + 
                  fixedTemplate + 
                  modifiedHtml.substring(actualPos + templateString.length);
    
    otherFixes++;
  }
}

if (otherFixes > 0) {
  fs.writeFileSync(dashboardPath, modifiedHtml);
  console.log(`Fixed ${otherFixes} additional template issues`);
}

console.log('Script completed. Notification template has been fixed.');