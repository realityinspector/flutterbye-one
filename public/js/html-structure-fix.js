/**
 * HTML Structure Fix
 * 
 * This script helps diagnose and fix issues with HTML structure
 * that might cause "Unexpected end of input" errors.
 */
(function() {
  console.log('HTML Structure Fix loaded');
  
  // Function to check for common HTML/JS structure issues
  function checkDocumentStructure() {
    // Check for unclosed script tags
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script, index) => {
      try {
        // If the script has any syntax errors, they'll be caught here
        if (script.innerText && script.innerText.trim() !== '') {
          new Function(script.innerText);
        }
      } catch (e) {
        console.error(`Possible syntax error in script #${index+1}:`, e.message);
        console.log('Script content preview:', script.innerText.substring(0, 100) + '...');
      }
    });
    
    // Check for missing closing brackets or braces in inline scripts
    const inlineScripts = Array.from(scripts).filter(s => !s.src);
    inlineScripts.forEach((script, index) => {
      const content = script.innerText || '';
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openBrackets = (content.match(/\(/g) || []).length;
      const closeBrackets = (content.match(/\)/g) || []).length;
      
      if (openBraces !== closeBraces) {
        console.error(`Script #${index+1} has mismatched braces: ${openBraces} opening vs ${closeBraces} closing`);
      }
      
      if (openBrackets !== closeBrackets) {
        console.error(`Script #${index+1} has mismatched brackets: ${openBrackets} opening vs ${closeBrackets} closing`);
      }
    });
    
    console.log('Document structure check complete');
  }
  
  // Wait for the document to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDocumentStructure);
  } else {
    checkDocumentStructure();
  }
  
  console.log('HTML Structure Fix initialized');
})();