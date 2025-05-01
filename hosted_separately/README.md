# Walk N Talk CRM Landing Page

This directory contains the landing page website for the Walk N Talk CRM application.

The landing page has been separated from the main mobile app to reduce bundle size and remove DOM-centric CSS/JS bloat as part of our optimizations. This separation helps keep the Expo build under 25 MB.

## Hosting Guidelines

1. This landing page should be hosted separately on a static hosting platform (e.g., Netlify, Vercel, or GitHub Pages).
2. The API server URL should be configured in the landing page's environment.
3. The mobile app now exclusively serves the React Native application without any web-specific code.

## Files

- `index.html` - The main landing page
- `style.css` - CSS styles for the landing page
- `app.js` - JavaScript functionality for the landing page

## Setup

1. Upload these files to your static hosting provider
2. Configure the API_URL in app.js to point to your API server
3. Update any branding or content as needed