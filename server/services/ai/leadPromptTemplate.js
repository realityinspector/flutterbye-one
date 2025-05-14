/**
 * Lead Prompt Template
 * Provides standardized templates for lead generation with specific JSON structure
 */

/**
 * Get a templated prompt for lead generation
 * This ensures that all lead generation responses follow a consistent format
 * @param {string} criteria - Natural language description of the leads to find
 * @param {Array} previousLeads - Array of previously returned leads (optional)
 * @param {boolean} fetchMoreLeads - Indicates if this is a request for more leads
 * @returns {string} Formatted prompt for lead generation
 */
function getLeadGenerationPrompt(criteria, previousLeads = [], fetchMoreLeads = false) {
  // Build the prompt with conditional elements
  let previousLeadsSection = '';
  
  if (fetchMoreLeads && previousLeads && previousLeads.length > 0) {
    previousLeadsSection = `
    IMPORTANT: I already have the following leads from a previous search. 
    Please DO NOT include these companies in your results and find different leads:
    ${JSON.stringify(previousLeads.map(lead => ({
      companyName: lead.companyName,
      website: lead.website
    })))}
    `;
  }
  
  return `
    You are a sales research assistant that helps sales professionals find new leads.
    I will describe what kinds of leads I'm looking for, and you will use the web search feature to find relevant companies or individuals that match my criteria.
    
    For each lead you find, please include the following information in a structured format:
    - Company name
    - Contact name (CRITICALLY IMPORTANT - make extra effort to find the name of a key decision maker)
    - Phone number (CRITICALLY IMPORTANT - make extra effort to find a direct contact number)
    - Email (CRITICALLY IMPORTANT - make extra effort to find a direct contact email)
    - Industry
    - Website
    - Address, City, State, Zip (if available)
    - A brief description of why this lead matches my criteria
    - List of sources (URLs) where you found the information
    
    My lead criteria: ${criteria}
    
    ${previousLeadsSection}
    
    IMPORTANT INSTRUCTIONS:
    1. Make finding contact information your highest priority. Search company websites, LinkedIn, business directories, and other sources.
    2. For each company, try to find a specific decision maker (CEO, founder, manager, director) rather than generic contact info.
    3. Make multiple search attempts with different search terms if initial searches don't yield contact information.
    4. Phone numbers should be properly formatted with area codes and country codes if available.
    
    When you respond, first provide a brief summary of your search results (2-3 sentences maximum).
    Then return your findings as a valid JSON array of lead objects with these exact keys:
    
    [
      {
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
      }
    ]
    
    IMPORTANT: Make sure your response contains ONLY valid JSON after the summary. The JSON must be properly formatted with all quotes escaped correctly.
    
    Your response must include an additional property "no_more_records_available": boolean that should be set to true ONLY if you're confident that no additional relevant leads exist beyond what you've already provided and the previous leads. Otherwise, set this to false.
    
    Use your web search capability to find current, accurate information. Do not make up any information.
    If you cannot find a specific piece of information, leave it as null.
    Find up to 15 high-quality leads that best match my criteria, prioritizing leads where you can find complete contact information.
    ${fetchMoreLeads ? 'Try to find different leads than what might be expected from my previous search.' : ''}
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
      return { leads: [], summary: '', no_more_records_available: false };
    }
    
    let summary = '';
    let jsonStr = response;
    let no_more_records_available = false;
    
    // Try to extract summary (non-JSON text before the JSON array)
    const jsonStartIndex = response.indexOf('[');
    if (jsonStartIndex > 0) {
      summary = response.substring(0, jsonStartIndex).trim();
      jsonStr = response.substring(jsonStartIndex);
    }
    
    // Check for the no_more_records_available flag in the response
    const noMoreRecordsMatch = response.match(/"no_more_records_available"\s*:\s*(true|false)/i);
    if (noMoreRecordsMatch && noMoreRecordsMatch[1]) {
      no_more_records_available = noMoreRecordsMatch[1].toLowerCase() === 'true';
    }
    
    // Find the first valid JSON array in the response
    const matches = jsonStr.match(/\[\s*\{.*\}\s*\]/s);
    if (matches && matches[0]) {
      try {
        const leadsArray = JSON.parse(matches[0]);
        return { leads: leadsArray, summary, no_more_records_available };
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
              return { leads: [lead], summary: newSummary || summary, no_more_records_available };
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
          return { leads, summary, no_more_records_available };
        }
      } catch (parseError) {
        console.error('Error processing JSON objects:', parseError);
      }
    }
    
    // Last attempt: try to parse the entire response as JSON
    try {
      // Clean up the JSON string by removing incomplete fragments
      let cleanedJsonStr = jsonStr;
      
      // Try to find complete JSON objects/arrays
      const lastClosingBrace = jsonStr.lastIndexOf('}');
      const lastClosingBracket = jsonStr.lastIndexOf(']');
      
      if (lastClosingBrace > 0 || lastClosingBracket > 0) {
        // Find the position of the last valid JSON terminator
        const lastValidPos = Math.max(lastClosingBrace, lastClosingBracket) + 1;
        cleanedJsonStr = jsonStr.substring(0, lastValidPos);
        
        // Try to find the matching opening bracket/brace
        const firstOpeningBracket = cleanedJsonStr.indexOf('[');
        const firstOpeningBrace = cleanedJsonStr.indexOf('{');
        
        if (firstOpeningBracket >= 0 && lastClosingBracket > firstOpeningBracket) {
          // We have a complete array
          cleanedJsonStr = cleanedJsonStr.substring(firstOpeningBracket, lastClosingBracket + 1);
          
          try {
            const arrayJson = JSON.parse(cleanedJsonStr);
            if (Array.isArray(arrayJson) && arrayJson.length > 0) {
              return { leads: arrayJson, summary, no_more_records_available };
            }
          } catch (arrayError) {
            console.log('Could not parse cleaned array JSON:', arrayError);
          }
        } else if (firstOpeningBrace >= 0 && lastClosingBrace > firstOpeningBrace) {
          // We have a complete object
          cleanedJsonStr = cleanedJsonStr.substring(firstOpeningBrace, lastClosingBrace + 1);
          
          try {
            const objJson = JSON.parse(cleanedJsonStr);
            // Extract the no_more_records_available flag if present
            if (objJson && objJson.no_more_records_available !== undefined) {
              no_more_records_available = !!objJson.no_more_records_available;
            }
            // Handle case where response is an object with a leads array
            if (objJson && objJson.leads && Array.isArray(objJson.leads)) {
              return { 
                leads: objJson.leads, 
                summary: objJson.summary || summary,
                no_more_records_available: objJson.no_more_records_available !== undefined ? 
                  objJson.no_more_records_available : no_more_records_available
              };
            }
            // Handle case where response is a single lead object
            if (objJson && objJson.companyName) {
              return { leads: [objJson], summary, no_more_records_available };
            }
          } catch (objError) {
            console.log('Could not parse cleaned object JSON:', objError);
          }
        }
      }
      
      // Try the original string as a fallback
      const parsedJson = JSON.parse(jsonStr);
      
      // Extract the no_more_records_available flag if present in the parsed JSON
      if (parsedJson && parsedJson.no_more_records_available !== undefined) {
        no_more_records_available = !!parsedJson.no_more_records_available;
      }
      
      // Handle case where response is an object with a leads array
      if (parsedJson && parsedJson.leads && Array.isArray(parsedJson.leads)) {
        return { 
          leads: parsedJson.leads, 
          summary: parsedJson.summary || summary,
          no_more_records_available: parsedJson.no_more_records_available !== undefined ? 
            parsedJson.no_more_records_available : no_more_records_available
        };
      }
      // Handle case where response is directly an array
      if (Array.isArray(parsedJson)) {
        return { leads: parsedJson, summary, no_more_records_available };
      }
      // Handle case where response is a single lead object
      if (parsedJson && parsedJson.companyName) {
        return { leads: [parsedJson], summary, no_more_records_available };
      }
    } catch (parseError) {
      console.log('Error parsing full response as JSON:', parseError);
    }
    
    // If we got here, we couldn't parse any leads
    console.warn('Could not extract leads from response - returning empty results');
    return { leads: [], summary: 'No leads could be parsed from the AI response', no_more_records_available: false };
  } catch (error) {
    console.error('Error extracting leads from AI response:', error);
    return { leads: [], summary: 'Error parsing lead data', no_more_records_available: false };
  }
}

module.exports = {
  getLeadGenerationPrompt,
  extractLeadsFromResponse
};
