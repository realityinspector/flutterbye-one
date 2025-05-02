# OpenRouter Integration Guide

## Overview

This document outlines the integration of OpenRouter's API service into our CRM application. OpenRouter serves as a unified gateway to state-of-the-art AI language models, allowing our application to leverage various AI capabilities including standard chat completions and web-enabled search functionality.

## Key Features

### 1. Web Search vs. Standard Chat

OpenRouter integration supports two distinct modes of operation:

- **Standard Chat Completion**: Uses AI models (OpenAI GPT or Llama) for answering questions based solely on the model's training data. No external information sources are accessed.

- **Web Search-Enabled Chat**: Specifically uses OpenAI's models with the "online" capability suffix (e.g., "gpt-4o:online") to perform web searches and incorporate up-to-date information in responses. This mode is crucial for retrieving current information beyond the model's training cutoff date.

### 2. Lead Generation with Natural Language

A specialized implementation of the web search functionality is the "Find New Leads" feature, which allows users to describe their ideal prospects in natural language and receive structured lead information.

## Lead Generation Workflow

1. **User Request**: The user enters a natural language description of the leads they're looking for (e.g., "Find software companies in Boston with 20-50 employees specializing in healthcare")

2. **Progress Notification**: The system shows a progress indicator while the AI searches the web for matching leads

3. **Structured Results**: The AI returns leads in a standardized JSON format with the following fields:
   - Company name
   - Contact information (when available)
   - Industry
   - Location data
   - Website
   - Description of why the lead matches the criteria
   - Source URLs for verification

4. **Lead Approval**: Users can review the generated leads and select which ones to import into their CRM database

## Technical Implementation

### Web Search Configuration

When utilizing web search capabilities, the following parameters are used:

```javascript
{
  model: "openai/gpt-4o:online", // Must use a model with :online suffix
  webSearch: true,               // Enable web search capability
  temperature: 0.3,              // Lower temperature for more focused results
  maxTokens: 3000                // Higher token limit for comprehensive results
}
```

### Lead Generation Template

To ensure consistent results, lead generation uses a standardized prompt template that:

1. Instructs the AI to act as a sales research assistant
2. Provides specific format requirements for the structured data
3. Requests a brief summary of the search results
4. Demands sources for all information provided

### Data Processing

The system extracts both structured lead data and a text summary from the AI response, allowing users to both understand the search context and access detailed lead information.

## Usage Notes

1. The system will always use OpenAI's online models for web search and lead generation, as these capabilities require web access

2. For standard chat completions without web search, the system can use either OpenAI or other available models like Llama

3. Lead generation can return 1-5 leads per request, balancing between breadth and quality

4. All generated leads include source URLs, allowing users to verify the information before importing