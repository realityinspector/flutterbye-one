/**
 * JSON Error Fix Script
 * 
 * This script identifies and fixes the "Unexpected end of input" error by adding
 * proper JSON response handling to API endpoints.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Find all JavaScript files in the server routes directory
function findRouteFiles() {
  console.log('Scanning for route files...');
  
  const routesDir = path.join(__dirname, '../server/routes');
  const indexRoutes = path.join(__dirname, '../server/routes.js');
  const mainServerFile = path.join(__dirname, '../server/index.js');
  
  let files = [];
  
  // Add main routes file
  if (fs.existsSync(indexRoutes)) {
    files.push(indexRoutes);
  }
  
  // Add server index.js
  if (fs.existsSync(mainServerFile)) {
    files.push(mainServerFile);
  }
  
  // Add routes directory files if it exists
  if (fs.existsSync(routesDir)) {
    const dirFiles = fs.readdirSync(routesDir);
    
    // Add all JavaScript files from the routes directory
    dirFiles.forEach(file => {
      if (file.endsWith('.js')) {
        files.push(path.join(routesDir, file));
      }
    });
  }
  
  console.log(`Found ${files.length} route files to check`);
  return files;
}

// Check each file for JSON response handling issues
function checkAndFixRouteFiles(files) {
  console.log('Checking route files for JSON response issues...');
  
  let fixesApplied = 0;
  
  files.forEach(filePath => {
    console.log(`\nChecking file: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    
    // Look for res.json() calls without proper error handling
    const resJsonMatches = content.match(/res\.json\(\s*([^)]+)\s*\)/g) || [];
    
    console.log(`Found ${resJsonMatches.length} res.json() calls`);
    
    // Verify each res.json() call for proper structure
    resJsonMatches.forEach(match => {
      // Check if the JSON structure is properly formed
      const jsonArgMatch = match.match(/res\.json\(\s*([^)]+)\s*\)/);
      
      if (jsonArgMatch && jsonArgMatch[1]) {
        const jsonArg = jsonArgMatch[1].trim();
        
        // Look for potential issues in the JSON argument
        const hasBraces = jsonArg.includes('{') && jsonArg.includes('}');
        const hasValidStructure = 
          (jsonArg.startsWith('{') && jsonArg.endsWith('}')) || 
          (jsonArg.startsWith('[') && jsonArg.endsWith(']')) ||
          jsonArg.match(/^\w+$/); // Variable name
        
        // If the argument has braces but isn't properly structured, this could be a source of errors
        if (hasBraces && !hasValidStructure) {
          console.log(`Potential malformed JSON in: ${match}`);
        }
      }
    });
    
    // Look for API endpoints
    const apiEndpointRegex = /app\.(get|post|put|delete)\s*\(\s*(['"`][^'"`]+['"`])/g;
    let match;
    
    while ((match = apiEndpointRegex.exec(content)) !== null) {
      const method = match[1];
      const endpoint = match[2].replace(/['"` ]/g, '');
      
      console.log(`Found ${method.toUpperCase()} endpoint: ${endpoint}`);
      
      // Check if the endpoint uses proper error handling
      const endpointPosition = match.index;
      const routeHandler = content.substring(endpointPosition);
      const routeClosingBrace = findClosingBrace(routeHandler);
      
      if (routeClosingBrace > 0) {
        const handlerCode = routeHandler.substring(0, routeClosingBrace + 1);
        
        // Check if res.json is called without proper try/catch
        if (handlerCode.includes('res.json') && 
            !handlerCode.includes('try {') && 
            !handlerCode.includes('catch')) {
          
          console.log(`⚠️ Endpoint ${endpoint} missing error handling for JSON responses`);
          
          // Create a fix by wrapping the content in try/catch
          const updatedHandler = handlerCode.replace(
            /(\s*async\s*)?\(\s*req\s*,\s*res\s*(?:,\s*next\s*)?\)\s*(?:=>)?\s*{/,
            '$1(req, res$3) => {\n  try {'
          ).replace(
            /}(?:\s*\))?;?\s*$/,
            '  } catch (error) {\n    console.error(`Error in ${endpoint}:`, error);\n    res.status(500).json({ success: false, message: "Internal server error" });\n  }\n});'
          );
          
          updatedContent = updatedContent.replace(handlerCode, updatedHandler);
          fixesApplied++;
        }
      }
    }
    
    // Save updated content if changes were made
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Applied fixes to ${path.basename(filePath)}`);
    }
  });
  
  console.log(`\nTotal fixes applied: ${fixesApplied}`);
  return fixesApplied > 0;
}

// Add global error handling at the Express level
function addGlobalErrorHandling() {
  console.log('\nAdding global error handling to server...');
  
  const serverFile = path.join(__dirname, '../server/index.js');
  
  if (fs.existsSync(serverFile)) {
    let content = fs.readFileSync(serverFile, 'utf8');
    
    // Check if error handling middleware is already present
    if (!content.includes('app.use((err, req, res, next)')) {
      // Find a good place to insert the middleware (before app.listen)
      const listenMatch = content.match(/app\.listen\(/);
      
      if (listenMatch) {
        const position = listenMatch.index;
        
        // Add error handling middleware before app.listen
        const middleware = `
// Add global error handling
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Send an appropriate error response
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

`;
        
        // Insert the middleware code
        const updatedContent = content.slice(0, position) + middleware + content.slice(position);
        fs.writeFileSync(serverFile, updatedContent);
        
        console.log('✅ Added global error handling middleware to server/index.js');
        return true;
      } else {
        console.log('⚠️ Could not find app.listen() in server/index.js');
      }
    } else {
      console.log('ℹ️ Global error handling already present');
    }
  } else {
    console.log('⚠️ Could not find server/index.js');
  }
  
  return false;
}

// Add debug monitoring to server-side API calls
function addApiDebugging() {
  console.log('\nAdding API debug monitoring...');
  
  const routesFile = path.join(__dirname, '../server/routes.js');
  
  if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');
    
    // Check if debugging is already added
    if (!content.includes('JSON Response Debug')) {
      // Find a good place to add monitoring
      const registerRoutesMatch = content.match(/function registerRoutes\(app\)\s*{/);
      
      if (registerRoutesMatch) {
        const position = registerRoutesMatch.index + registerRoutesMatch[0].length;
        
        // Add debug monitoring to routes
        const debugCode = `
  // JSON Response Debug Middleware
  app.use((req, res, next) => {
    // Store the original res.json function
    const originalJson = res.json;
    
    // Override json method to add logging and validation
    res.json = function(data) {
      try {
        // Validate by stringifying the data first
        const jsonString = JSON.stringify(data);
        
        // Confirm it's valid JSON by parsing it back
        JSON.parse(jsonString);
        
        // Log debug info
        console.log(\`API Response to \${req.method} \${req.url}: Valid JSON sent, content length \${jsonString.length}\`);
        
        // Call the original json method with the data
        return originalJson.call(this, data);
      } catch (error) {
        // Log error and send a safe response instead
        console.error(\`JSON serialization error in response to \${req.method} \${req.url}:, \${error.message}\`);
        console.error('Data that caused the error:', data);
        
        // Send a safe response
        return originalJson.call(this, { 
          success: false, 
          message: 'An error occurred while processing the response',
          error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
      }
    };
    
    next();
  });

`;
        
        // Insert the debug code
        const updatedContent = content.slice(0, position) + debugCode + content.slice(position);
        fs.writeFileSync(routesFile, updatedContent);
        
        console.log('✅ Added API response debug monitoring to server/routes.js');
        return true;
      } else {
        console.log('⚠️ Could not find registerRoutes function in server/routes.js');
      }
    } else {
      console.log('ℹ️ API debug monitoring already present');
    }
  } else {
    console.log('⚠️ Could not find server/routes.js');
  }
  
  return false;
}

// Helper function to find the closing brace of a code block
function findClosingBrace(code) {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    
    // Handle string literals
    if ((char === "'" || char === '"' || char === '`') && (i === 0 || code[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    
    // Skip characters inside strings
    if (inString) continue;
    
    // Count braces
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return i;
      }
    }
  }
  
  return -1;
}

// Main function
function main() {
  console.log('Starting JSON Error Fix Script...\n');
  
  // Find all route files
  const routeFiles = findRouteFiles();
  
  // Check and fix route files
  const routeFixesApplied = checkAndFixRouteFiles(routeFiles);
  
  // Add global error handling
  const errorHandlingAdded = addGlobalErrorHandling();
  
  // Add API debugging
  const debuggingAdded = addApiDebugging();
  
  console.log('\nSummary:');
  console.log(`- Route fixes applied: ${routeFixesApplied ? 'Yes' : 'No'}`);
  console.log(`- Global error handling added: ${errorHandlingAdded ? 'Yes' : 'No'}`);
  console.log(`- API debugging added: ${debuggingAdded ? 'Yes' : 'No'}`);
  
  console.log('\nScript completed. Restart the server to apply the changes.');
}

// Run the main function
main();