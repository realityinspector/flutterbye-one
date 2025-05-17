/**
 * Safe Data Loader - Minimal Version
 */
(function() {
  console.log('Safe data loader initialized');
  window.safeLoadData = function(url, options = {}) {
    return fetch(url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
      ...options
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading data:', error);
      return { error: true, message: error.message };
    });
  };
  console.log('Safe data loader ready');
})();