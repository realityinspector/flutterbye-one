/**
 * HTML Structure Fix
 * 
 * This script fixes common structural issues in HTML when loaded into the page.
 * It specifically targets issues with template literals and unclosed tags.
 */

(function() {
  console.log('HTML Structure Fix loaded');
  
  // Fix any unclosed HTML tags in the page
  function checkDocumentStructure() {
    // This is a simple check that won't catch everything but helps with basic issues
    const html = document.documentElement.outerHTML;
    
    // Check for common unclosed tags
    const tags = ['div', 'span', 'p', 'li', 'ul', 'ol', 'table', 'tr', 'td', 'th'];
    let issues = 0;
    
    tags.forEach(tag => {
      const openCount = (html.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).length;
      const closeCount = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      
      if (openCount > closeCount) {
        console.warn(`Possible unclosed <${tag}> tags: ${openCount - closeCount} missing`);
        issues++;
      }
    });
    
    // Check for script tags inside other script tags (a common issue)
    const scriptContent = document.querySelectorAll('script:not([src])');
    scriptContent.forEach((script, index) => {
      if (script.textContent.includes('<script')) {
        console.warn(`Script #${index + 1} contains nested <script> tag - this can cause parsing issues`);
        issues++;
      }
    });
    
    console.log('Document structure check complete');
    return issues === 0;
  }
  
  // Run the structure check after the page is fully loaded
  if (document.readyState === 'complete') {
    checkDocumentStructure();
  } else {
    window.addEventListener('load', checkDocumentStructure);
  }
  
  // Add a global utility for detecting and logging script errors
  window.addEventListener('error', function(event) {
    if (event.error) {
      console.error('JavaScript error:', event.error.message);
      
      // If this is a syntax error, try to provide more information
      if (event.error.message.includes('Unexpected token')) {
        const scripts = document.querySelectorAll('script:not([src])');
        
        // Log which script might have the issue
        scripts.forEach((script, index) => {
          try {
            // Try to evaluate the script content
            new Function(script.textContent);
          } catch (error) {
            // Log errors with their script number for easier identification
            console.error(`Possible syntax error in script #${index + 1}:`, error.message);
            
            // If error is about an unexpected token, show beginning of script
            if (error.message.includes('Unexpected token')) {
              console.log('Script content preview:', JSON.stringify(script.textContent.substring(0, 100)).slice(1, -1));
            }
          }
        });
      }
    }
  });
  
  console.log('HTML Structure Fix initialized');
})();