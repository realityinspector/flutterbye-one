// Simple entry point for now
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  
  // Display welcome message
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
      <h1 style="color: #0066ff; font-size: 28px; margin-bottom: 20px;">Walk N Talk CRM</h1>
      <div style="background-color: #e6f0ff; padding: 24px; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #0066ff; font-size: 20px; margin-bottom: 16px;">Welcome to your CRM</h2>
        <p style="margin-bottom: 12px;">Your sales acceleration platform is ready to use.</p>
        <p>Manage leads, track calls, and boost your sales performance!</p>
      </div>
    </div>
  `;
});

