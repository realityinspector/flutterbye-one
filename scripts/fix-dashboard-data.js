/**
 * Dashboard Data Fix Script
 * 
 * This script tests and diagnoses issues with dashboard data loading
 * and implements a fix for the "Unexpected end of input" error.
 */

const fs = require('fs');
const path = require('path');

// Find and fix the HTML structure errors in dashboard.html
function fixDashboardFetchIssue() {
  const dashboardPath = path.join(__dirname, '../public/dashboard.html');
  
  if (!fs.existsSync(dashboardPath)) {
    console.error('Dashboard HTML file not found');
    return;
  }
  
  console.log('Reading dashboard.html...');
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Fix unclosed <li> tag issue
  console.log('Checking for unclosed <li> tags...');
  const liOpenCount = (content.match(/<li[^>]*>/g) || []).length;
  const liCloseCount = (content.match(/<\/li>/g) || []).length;
  
  if (liOpenCount > liCloseCount) {
    console.log(`Found ${liOpenCount - liCloseCount} unclosed <li> tags`);
    // Look for the last <li> tag without a closing tag
    const liRegex = /<li[^>]*>(?:(?!<\/li>).)*$/;
    content = content.replace(liRegex, (match) => match + '</li>');
  }
  
  // Fix unclosed <th> tag issue
  console.log('Checking for unclosed <th> tags...');
  const thOpenCount = (content.match(/<th[^>]*>/g) || []).length;
  const thCloseCount = (content.match(/<\/th>/g) || []).length;
  
  if (thOpenCount > thCloseCount) {
    console.log(`Found ${thOpenCount - thCloseCount} unclosed <th> tags`);
    // Look for the last <th> tag without a closing tag
    const thRegex = /<th[^>]*>(?:(?!<\/th>).)*$/;
    content = content.replace(thRegex, (match) => match + '</th>');
  }
  
  // Fix nested <script> tags
  console.log('Checking for nested script tags...');
  let scriptTags = content.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  
  for (let i = 0; i < scriptTags.length; i++) {
    const scriptTag = scriptTags[i];
    if (scriptTag.includes('<script') && scriptTag.indexOf('<script') !== 0) {
      console.log(`Found nested script tag in script #${i + 1}`);
      
      // Replace the literal "<script" with a string representation
      const fixedScript = scriptTag.replace(/<script/g, function(match, offset) {
        // Only replace if it's not the opening tag
        if (offset > 10) return '"<"+"script"';
        return match;
      });
      
      content = content.replace(scriptTag, fixedScript);
    }
  }
  
  // Fix any unclosed template literals
  console.log('Checking for unclosed template literals...');
  let inlineScripts = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  
  for (let i = 0; i < inlineScripts.length; i++) {
    // Count backticks in the script
    const script = inlineScripts[i];
    const backticks = (script.match(/`/g) || []).length;
    
    if (backticks % 2 !== 0) {
      console.log(`Found script #${i + 1} with odd number of backticks (${backticks})`);
      
      // Find the last unclosed backtick and close it
      const scriptContent = script.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
      const lastBacktickIndex = scriptContent.lastIndexOf('`');
      
      if (lastBacktickIndex !== -1) {
        // Check if this is an opening backtick without a closing one
        const afterLastBacktick = scriptContent.substring(lastBacktickIndex + 1);
        if (!afterLastBacktick.includes('`')) {
          console.log('Found unclosed template literal, fixing...');
          const fixedScript = script.replace(
            scriptContent,
            scriptContent.substring(0, lastBacktickIndex) + 
            scriptContent.substring(lastBacktickIndex).replace('`', '"+`')
          );
          content = content.replace(script, fixedScript);
        }
      }
    }
  }
  
  // Write the fixed content back to the file
  fs.writeFileSync(dashboardPath, content);
  console.log('Fixed dashboard HTML structure issues');
}

// Run the fix
fixDashboardFetchIssue();