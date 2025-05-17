/**
 * Fix Template Strings
 * 
 * This script fixes HTML template strings in the dashboard.html file
 * that are causing JavaScript syntax errors
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Read the dashboard HTML file
console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Identify and fix template literal issues in JavaScript
console.log('Fixing template literal issues...');

// 1. Replace the problematic notification HTML template
let fixedHtml = dashboardHtml.replace(
  /notification\.innerHTML\s*=\s*`\s*<div class="notification-icon">/g,
  'notification.innerHTML = renderNotificationTemplate(title, message, icon, type);'
);

// 2. Fix template strings containing HTML by adding a helper function at the top of the file
const safeTemplateHelper = `
<script>
// Helper function for safe HTML templates
function safeHTML(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] !== undefined ? values[i] : '');
  }, '');
}

// Helper for notification templates
function renderNotificationTemplate(title, message, icon, type = 'default') {
  return '<div class="notification-icon">' +
         '<i class="fas fa-' + icon + '"></i>' +
         '</div>' +
         '<div class="notification-content">' +
         '<div class="notification-title">' + title + '</div>' +
         '<p class="notification-message">' + message + '</p>' +
         '</div>' +
         '<button class="notification-close">' +
         '<i class="fas fa-times"></i>' +
         '</button>';
}
</script>
`;

// Insert the helper function right after the opening <body> tag
const bodyTagIndex = fixedHtml.indexOf('<body>') + '<body>'.length;
fixedHtml = fixedHtml.slice(0, bodyTagIndex) + safeTemplateHelper + fixedHtml.slice(bodyTagIndex);

// 3. Fix other template strings with HTML
const problematicPatterns = [
  { 
    pattern: /innerHTML\s*=\s*`\s*<([^`]*)\$\{([^}]*)\}([^`]*)`/g,
    replacement: (match, before, variable, after) => {
      return `innerHTML = '<${before}' + ${variable} + '${after}'`;
    }
  },
  {
    pattern: /=\s*`\s*<([a-zA-Z][^>]*)>([^`]*)<\/([a-zA-Z][^>]*)>`/g,
    replacement: (match, openTag, content, closeTag) => {
      return `= '<${openTag}>${content}</${closeTag}>'`;
    }
  }
];

// Apply each fix pattern
problematicPatterns.forEach(({ pattern, replacement }) => {
  fixedHtml = fixedHtml.replace(pattern, replacement);
});

// Replace any specific problematic script blocks
// Finding the specific script #13 mentioned in the error
const scriptTags = fixedHtml.match(/<script(?!\s+src=)[^>]*>([\s\S]*?)<\/script>/g) || [];
console.log(`Found ${scriptTags.length} script blocks`);

if (scriptTags.length >= 13) {
  const problematicScript = scriptTags[12]; // 0-indexed, so script #13 is at index 12
  console.log(`Examining script #13 (${problematicScript.length} chars)`);
  
  // Replace the entire problematic script with a safer version
  // First, we need to extract its content
  const scriptContentMatch = /<script[^>]*>([\s\S]*?)<\/script>/g.exec(problematicScript);
  if (scriptContentMatch && scriptContentMatch[1]) {
    const scriptContent = scriptContentMatch[1];
    
    // Look for template literals with HTML in them
    const templateStart = scriptContent.indexOf('`');
    if (templateStart !== -1) {
      const templateEnd = scriptContent.indexOf('`', templateStart + 1);
      if (templateEnd !== -1) {
        console.log(`Found template string from ${templateStart} to ${templateEnd}`);
        
        // Get the template content
        const templateContent = scriptContent.substring(templateStart + 1, templateEnd);
        
        // Check if it contains HTML tags
        if (/<[a-zA-Z][^>]*>/g.test(templateContent)) {
          console.log('Template contains HTML - fixing');
          
          // Replace backticks with quotes and fix variable interpolation
          const fixedContent = templateContent
            .replace(/\$\{([^}]*)\}/g, "' + $1 + '")
            .replace(/"/g, '\\"');
          
          // Create fixed script content
          const fixedScriptContent = 
            scriptContent.substring(0, templateStart) + 
            "'" + fixedContent + "'" + 
            scriptContent.substring(templateEnd + 1);
          
          // Replace in the full HTML
          const fixedScript = `<script>${fixedScriptContent}</script>`;
          fixedHtml = fixedHtml.replace(problematicScript, fixedScript);
          console.log('Applied fix to script #13');
        }
      }
    }
  }
}

// Write the updated HTML back to the file
fs.writeFileSync(dashboardPath, fixedHtml);
console.log('Fixed template strings in dashboard.html');