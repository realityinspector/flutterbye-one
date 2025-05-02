/**
 * Lead Prompt Template
 * Provides standardized templates for lead generation with specific JSON structure
 */

/**
 * Get a templated prompt for lead generation
 * This ensures that all lead generation responses follow a consistent format
 * @param {string} criteria - Natural language description of the leads to find
 * @returns {string} Formatted prompt for lead generation
 */
function getLeadGenerationPrompt(criteria) {
  return `
    You are a sales research assistant that helps sales professionals find new leads.
    I will describe what kinds of leads I'm looking for, and you will use the web search feature to find 1-5 relevant companies or individuals that match my criteria.
    
    For each lead you find, please include the following information in a structured format:
    - Company name
    - Contact name (if available)
    - Phone number (if available)
    - Email (if available)
    - Industry
    - Website
    - Address, City, State, Zip (if available)
    - A brief description of why this lead matches my criteria
    - List of sources (URLs) where you found the information
    
    My lead criteria: ${criteria}
    
    When you respond, first provide a brief summary of your search results (2-3 sentences maximum).
    Then return your findings as a valid JSON array of lead objects with these exact keys:
    [{
      "companyName": "string",
      "contactName": "string or null",
      "phoneNumber": "string or null",
      "email": "string or null",
      "industry": "string or null",
      "website": "string or null",
      "address": "string or null",
      "city": "string or null",
      "state": "string or null",
      "zipCode": "string or null",
      "description": "string describing why this lead matches the criteria",
      "sources": ["array of URLs where information was found"]
    }]
    
    Use your web search capability to find current, accurate information. Do not make up any information.
    If you cannot find a specific piece of information, leave it as null.
    Limit your response to 1-5 high-quality leads that best match my criteria.
  `;
}

/**
 * Extract leads from AI response
 * Parses the AI response to extract the leads array and summary
 * @param {string} response - Raw response from AI service
 * @returns {Object} Object containing leads array and summary text
 */
function extractLeadsFromResponse(response) {
  try {
    if (!response) {
      return { leads: [], summary: '' };
    }
    
    let summary = '';
    let jsonStr = response;
    
    // Try to extract summary (non-JSON text before the JSON array)
    const jsonStartIndex = response.indexOf('[');
    if (jsonStartIndex > 0) {
      summary = response.substring(0, jsonStartIndex).trim();
      jsonStr = response.substring(jsonStartIndex);
    }
    
    // Find the first valid JSON array in the response
    const matches = jsonStr.match(/\[\s*\{.*\}\s*\]/s);
    if (matches && matches[0]) {
      try {
        const leadsArray = JSON.parse(matches[0]);
        return { leads: leadsArray, summary };
      } catch (parseError) {
        console.error('Error parsing extracted JSON array:', parseError);
      }
    }
    
    // Special handling for responses from OpenRouter that don't properly format as a JSON array
    // Extract text up to the first JSON-like object as summary
    const firstJsonObjectMatch = response.match(/([^{]*)({[\s\S]*})/);
    if (firstJsonObjectMatch && firstJsonObjectMatch.length > 2) {
      const newSummary = firstJsonObjectMatch[1].trim();
      const potentialJsonText = firstJsonObjectMatch[2];
      
      try {
        // Try to parse the JSON object directly
        // Make sure we only get the first valid JSON block
        const jsonRegex = /{[\s\S]*?"sources"[\s\S]*?}/;
        const jsonMatch = potentialJsonText.match(jsonRegex);
        if (jsonMatch && jsonMatch[0]) {
          try {
            const lead = JSON.parse(jsonMatch[0]);
            if (lead && lead.companyName && lead.sources) {
              return { leads: [lead], summary: newSummary || summary };
            }
          } catch (parseError) {
            console.error('Error parsing matched JSON object:', parseError);
          }
        }
      } catch (error) {
        console.error('Error in special case parsing:', error);
      }
    }
    
    // Try to find any JSON objects in the text by searching for patterns that match lead objects
    // Look for objects with company name and sources fields which are specific to our lead format
    const objectMatches = response.match(/\{[\s\S]*?"companyName"[\s\S]*?"sources"[\s\S]*?\}/g) || 
                          response.match(/\{[\s\S]*?"sources"[\s\S]*?"companyName"[\s\S]*?\}/g);
    
    if (objectMatches && objectMatches.length > 0) {
      try {
        // For each potential JSON match, try to parse it as a lead
        const leads = objectMatches.map(objStr => {
          // Sanitize it for JSON parsing
          let cleanStr = objStr.trim();
          
          // Remove any trailing commas which would make JSON invalid
          cleanStr = cleanStr.replace(/,\s*$/, '');
          
          try {
            const leadObj = JSON.parse(cleanStr);
            // Verify it has the minimum required fields
            if (leadObj && leadObj.companyName) {
              // Make sure sources is always an array
              if (leadObj.sources && !Array.isArray(leadObj.sources)) {
                leadObj.sources = [leadObj.sources.toString()];
              } else if (!leadObj.sources) {
                leadObj.sources = [];
              }
              return leadObj;
            }
            return null;
          } catch (objError) {
            console.error('Error parsing JSON object:', objError);
            return null;
          }
        }).filter(lead => lead !== null); // Remove any null entries
        
        if (leads.length > 0) {
          // Extract text before first JSON object as summary if not already set
          if (!summary && objectMatches[0]) {
            const summaryEndIndex = response.indexOf(objectMatches[0]);
            if (summaryEndIndex > 0) {
              summary = response.substring(0, summaryEndIndex).trim();
            }
          }
          return { leads, summary };
        }
      } catch (parseError) {
        console.error('Error processing JSON objects:', parseError);
      }
    }
    
    // Last attempt: try to parse the entire response as JSON
    try {
      const parsedJson = JSON.parse(jsonStr);
      // Handle case where response is an object with a leads array
      if (parsedJson && parsedJson.leads && Array.isArray(parsedJson.leads)) {
        return { leads: parsedJson.leads, summary: parsedJson.summary || summary };
      }
      // Handle case where response is directly an array
      if (Array.isArray(parsedJson)) {
        return { leads: parsedJson, summary };
      }
      // Handle case where response is a single lead object
      if (parsedJson && parsedJson.companyName) {
        return { leads: [parsedJson], summary };
      }
    } catch (parseError) {
      console.error('Error parsing full response as JSON:', parseError);
    }
    
    // If we got here, we couldn't parse any leads
    console.error('Could not extract leads from response:', response);
    return { leads: [], summary: 'No leads could be parsed from the AI response' };
  } catch (error) {
    console.error('Error extracting leads from AI response:', error);
    return { leads: [], summary: 'Error parsing lead data' };
  }
}

module.exports = {
  getLeadGenerationPrompt,
  extractLeadsFromResponse
};
