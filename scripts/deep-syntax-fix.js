/**
 * Deep Syntax Fix
 * 
 * This script performs a deep scan of JavaScript code in the dashboard.html file
 * to find and fix syntax errors, particularly unclosed strings, invalid tokens, 
 * and unmatched delimiters.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');
const safeLoadingScriptPath = path.join(__dirname, '../public/js/safe-data-loader.js');

// Create a safe data loading script
function createSafeLoadingScript() {
  console.log('Creating safe data loading script...');
  
  const scriptContent = `/**
 * Safe Data Loader
 * 
 * This script provides a safe way to load and parse data from the API,
 * handling errors gracefully and preventing JavaScript syntax errors.
 */

(function() {
  console.log('Safe data loader initialized');
  
  // Function to safely load and parse JSON data
  function safeLoadData(url, options = {}) {
    return new Promise((resolve, reject) => {
      // Add default options for API requests
      const fetchOptions = {
        method: options.method || 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        },
        ...(options.body ? { body: options.body } : {})
      };
      
      // Set timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        console.error('Request timeout for ' + url);
        reject(new Error('Request timed out'));
      }, 15000);
      
      fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error('API error: ' + response.status);
          }
          
          return response.text();
        })
        .then(text => {
          try {
            // Attempt to parse the JSON response
            const data = JSON.parse(text);
            console.log('Successfully loaded data from ' + url);
            resolve(data);
          } catch (error) {
            console.error('JSON parse error for ' + url + ': ' + error.message);
            
            // For debugging, show the problematic text
            if (text.length > 500) {
              console.error('Response text (truncated): ' + text.substring(0, 200) + '...' + text.substring(text.length - 200));
            } else {
              console.error('Response text: ' + text);
            }
            
            // Return a safe error object instead of failing
            resolve({
              error: true,
              message: error.message,
              type: 'JSON_PARSE_ERROR'
            });
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Network error for ' + url + ': ' + error.message);
          
          // Return a safe error object
          resolve({
            error: true,
            message: error.message,
            type: 'NETWORK_ERROR'
          });
        });
    });
  }
  
  // Attach to window for global access
  window.safeLoadData = safeLoadData;
  
  // Create a safer API validator
  const apiValidator = {
    validateResponse: function(response) {
      if (!response) return false;
      
      if (response.error) {
        console.error('API error: ' + response.message);
        return false;
      }
      
      return true;
    }
  };
  
  window.apiValidator = apiValidator;
  
  console.log('Safe data loader ready');
})();`;

  fs.writeFileSync(safeLoadingScriptPath, scriptContent);
  console.log('Created safe data loading script');
}

// Function to find and fix JavaScript syntax errors in HTML file
function fixSyntaxErrors() {
  console.log('Reading dashboard.html...');
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  // 1. Extract all script blocks
  const scriptRegex = /<script(?!\s+src=)[^>]*>([\s\S]*?)<\/script>/g;
  const scripts = [];
  let match;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    scripts.push({
      fullMatch: match[0],
      content: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  console.log(`Found ${scripts.length} inline script blocks`);
  
  // 2. Fix common syntax problems in each script
  let offset = 0; // To track position changes
  
  scripts.forEach((script, index) => {
    console.log(`Analyzing script #${index + 1}...`);
    
    // Skip empty scripts
    if (!script.content.trim()) {
      console.log('  Empty script, skipping');
      return;
    }
    
    let fixedScript = script.content;
    let hasChanges = false;
    
    // 2.1. Fix unbalanced quotes
    const singleQuotes = (fixedScript.match(/'/g) || []).length;
    const doubleQuotes = (fixedScript.match(/"/g) || []).length;
    const backticks = (fixedScript.match(/`/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      console.log(`  Unbalanced single quotes in script #${index + 1}`);
      
      // Find the position of the last single quote
      const lastQuotePos = fixedScript.lastIndexOf("'");
      
      if (lastQuotePos !== -1) {
        // Check if this is likely an opening or closing quote
        const beforeChar = lastQuotePos > 0 ? fixedScript.charAt(lastQuotePos - 1) : '';
        const afterChar = lastQuotePos < fixedScript.length - 1 ? fixedScript.charAt(lastQuotePos + 1) : '';
        
        if (beforeChar === '=' || beforeChar === '(' || beforeChar === ',' || beforeChar === ':') {
          // This is likely an opening quote, so add a closing quote at the end of the line
          const lineEndPos = fixedScript.indexOf('\n', lastQuotePos);
          if (lineEndPos !== -1) {
            fixedScript = fixedScript.substring(0, lineEndPos) + "'" + fixedScript.substring(lineEndPos);
            hasChanges = true;
          }
        } else {
          // This is likely a closing quote, remove it
          fixedScript = fixedScript.substring(0, lastQuotePos) + fixedScript.substring(lastQuotePos + 1);
          hasChanges = true;
        }
      }
    }
    
    if (doubleQuotes % 2 !== 0) {
      console.log(`  Unbalanced double quotes in script #${index + 1}`);
      
      // Similar logic as for single quotes
      const lastQuotePos = fixedScript.lastIndexOf('"');
      
      if (lastQuotePos !== -1) {
        const beforeChar = lastQuotePos > 0 ? fixedScript.charAt(lastQuotePos - 1) : '';
        
        if (beforeChar === '=' || beforeChar === '(' || beforeChar === ',' || beforeChar === ':') {
          const lineEndPos = fixedScript.indexOf('\n', lastQuotePos);
          if (lineEndPos !== -1) {
            fixedScript = fixedScript.substring(0, lineEndPos) + '"' + fixedScript.substring(lineEndPos);
            hasChanges = true;
          }
        } else {
          fixedScript = fixedScript.substring(0, lastQuotePos) + fixedScript.substring(lastQuotePos + 1);
          hasChanges = true;
        }
      }
    }
    
    if (backticks % 2 !== 0) {
      console.log(`  Unbalanced backticks in script #${index + 1}`);
      
      // Find all template literals
      const templateRegex = /`([^`]*)`/g;
      const templateMatches = [];
      let templateMatch;
      
      while ((templateMatch = templateRegex.exec(fixedScript)) !== null) {
        templateMatches.push({
          full: templateMatch[0],
          content: templateMatch[1],
          start: templateMatch.index,
          end: templateMatch.index + templateMatch[0].length
        });
      }
      
      // Find orphaned backticks
      const allBackticks = [];
      let pos = -1;
      
      while ((pos = fixedScript.indexOf('`', pos + 1)) !== -1) {
        allBackticks.push(pos);
      }
      
      // Check for backticks that aren't part of a matched pair
      if (allBackticks.length % 2 !== 0) {
        // Find the orphaned backtick
        const orphanedPos = allBackticks[allBackticks.length - 1];
        
        // Check if this is a starting or ending backtick
        const beforeChar = orphanedPos > 0 ? fixedScript.charAt(orphanedPos - 1) : '';
        
        if (beforeChar === '=' || beforeChar === '(' || beforeChar === ',' || beforeChar === ':') {
          // This is likely a starting backtick, add an ending one
          fixedScript = fixedScript + '`';
        } else {
          // This is likely an ending backtick, remove it
          fixedScript = fixedScript.substring(0, orphanedPos) + fixedScript.substring(orphanedPos + 1);
        }
        
        hasChanges = true;
      }
    }
    
    // 2.2. Fix HTML in template literals
    const templateLiteralRegex = /`([\s\S]*?)`/g;
    let templateMatch;
    
    while ((templateMatch = templateLiteralRegex.exec(fixedScript)) !== null) {
      const templateContent = templateMatch[1];
      
      // Check if the template contains HTML
      if (/<[a-zA-Z][^>]*>/g.test(templateContent)) {
        // Fix template literal with HTML content
        const fixedTemplate = templateContent
          // Fix class attributes with interpolation
          .replace(/class="([^"]*)\$\{([^}]*)\}([^"]*)"/g, 'class="$1" + $2 + "$3"')
          // Fix other attributes with interpolation
          .replace(/([a-z-]+)="([^"]*)\$\{([^}]*)\}([^"]*)"/g, '$1="$2" + $3 + "$4"')
          // Fix tag content with interpolation
          .replace(/>([^<]*)\$\{([^}]*)\}([^<]*)</g, '>' + "$1" + ' + $2 + ' + '"$3"' + '<');
        
        if (fixedTemplate !== templateContent) {
          // Replace the template string with concatenated strings
          const newTemplate = templateContent
            .replace(/\$\{([^}]*)\}/g, '" + $1 + "')
            .replace(/\n/g, '\\n')
            .replace(/"/g, '\\"');
          
          const replacement = '"' + newTemplate + '"';
          
          fixedScript = fixedScript.substring(0, templateMatch.index) + 
                      replacement + 
                      fixedScript.substring(templateMatch.index + templateMatch[0].length);
          
          hasChanges = true;
        }
      }
    }
    
    // 2.3. Fix unbalanced braces and brackets
    const openBraces = (fixedScript.match(/{/g) || []).length;
    const closeBraces = (fixedScript.match(/}/g) || []).length;
    const openBrackets = (fixedScript.match(/\[/g) || []).length;
    const closeBrackets = (fixedScript.match(/\]/g) || []).length;
    const openParens = (fixedScript.match(/\(/g) || []).length;
    const closeParens = (fixedScript.match(/\)/g) || []).length;
    
    if (openBraces > closeBraces) {
      console.log(`  Unbalanced braces in script #${index + 1}: missing ${openBraces - closeBraces} closing braces`);
      fixedScript += '}'.repeat(openBraces - closeBraces);
      hasChanges = true;
    }
    
    if (openBrackets > closeBrackets) {
      console.log(`  Unbalanced brackets in script #${index + 1}: missing ${openBrackets - closeBrackets} closing brackets`);
      fixedScript += ']'.repeat(openBrackets - closeBrackets);
      hasChanges = true;
    }
    
    if (openParens > closeParens) {
      console.log(`  Unbalanced parentheses in script #${index + 1}: missing ${openParens - closeParens} closing parentheses`);
      fixedScript += ')'.repeat(openParens - closeParens);
      hasChanges = true;
    }
    
    // 2.4. Fix missing semicolons at statement ends
    const statementEndRegex = /([^;{}\n])[\s]*\n[\s]*(?:var|let|const|function|if|for|while|switch|return|try|throw)/g;
    fixedScript = fixedScript.replace(statementEndRegex, '$1;\n');
    
    // 2.5. Fix nested <script> tags (replace with string concatenation)
    if (fixedScript.includes('<script')) {
      fixedScript = fixedScript.replace(/<script/g, '"<"+"script"');
      fixedScript = fixedScript.replace(/<\/script>/g, '"</"+"script>"');
      hasChanges = true;
    }
    
    // Apply changes if needed
    if (hasChanges) {
      console.log(`  Fixed syntax issues in script #${index + 1}`);
      
      // Create new script tag with fixed content
      const newScript = `<script>${fixedScript}</script>`;
      
      // Update the HTML content, adjusting for position changes
      const actualStart = script.start + offset;
      const actualEnd = script.end + offset;
      
      content = content.substring(0, actualStart) + 
               newScript + 
               content.substring(actualEnd);
      
      // Update offset for position changes
      offset += (newScript.length - (actualEnd - actualStart));
    }
  });
  
  // 3. Add safe data loading script to the page
  if (!content.includes('/js/safe-data-loader.js')) {
    // Create the safe loading script
    createSafeLoadingScript();
    
    // Add script reference right after the first script tag
    const firstScriptEndPos = content.indexOf('</script>') + '</script>'.length;
    
    if (firstScriptEndPos !== -1) {
      content = content.substring(0, firstScriptEndPos) + 
               '\n  <script src="/js/safe-data-loader.js"></script>' + 
               content.substring(firstScriptEndPos);
    }
  }
  
  // 4. Write the fixed content back to the file
  fs.writeFileSync(dashboardPath, content);
  console.log('Fixed dashboard HTML with syntax issues');
}

// Execute the fix
fixSyntaxErrors();