/**
 * ModalManager - Reusable modal dialog system
 * Provides a consistent interface for creating and managing modal dialogs
 */
class ModalManager {
  /**
   * Create a new ModalManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      containerId: 'modal-container',
      overlayClass: 'modal-overlay',
      modalClass: 'modal',
      closeOnOverlayClick: true,
      closeButtonClass: 'modal-close',
      animationDuration: 300,
      ...options
    };
    
    // Active modals
    this.activeModals = [];
    
    // Ensure we have a container
    this.ensureContainer();
  }

  /**
   * Ensure the modal container exists
   * @private
   */
  ensureContainer() {
    let container = document.getElementById(this.options.containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this.options.containerId;
      document.body.appendChild(container);
    }
    
    this.container = container;
  }

  /**
   * Show a modal with the given content
   * @param {string|HTMLElement} content - Modal content
   * @param {Object} options - Modal-specific options
   * @returns {Object} Modal instance with close method
   */
  show(content, options = {}) {
    try {
      // Store previously focused element for restoration later
      this.previouslyFocused = document.activeElement;
      
      // Merge options
      const modalOptions = {
        ...this.options,
        ...options
      };
      
      // Create modal elements
      const overlay = document.createElement('div');
      overlay.className = modalOptions.overlayClass;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      
      if (modalOptions.title) {
        overlay.setAttribute('aria-labelledby', `modal-title-${Date.now()}`);
      } else {
        overlay.setAttribute('aria-label', modalOptions.ariaLabel || 'Dialog');
      }
      
      const modalEl = document.createElement('div');
      modalEl.className = modalOptions.modalClass;
      
      // Set size constraints
      if (modalOptions.width) {
        modalEl.style.width = typeof modalOptions.width === 'number' 
          ? `${modalOptions.width}px` 
          : modalOptions.width;
      }
      
      if (modalOptions.maxWidth) {
        modalEl.style.maxWidth = typeof modalOptions.maxWidth === 'number' 
          ? `${modalOptions.maxWidth}px` 
          : modalOptions.maxWidth;
      }
      
      if (modalOptions.height) {
        modalEl.style.height = typeof modalOptions.height === 'number' 
          ? `${modalOptions.height}px` 
          : modalOptions.height;
      }
      
      // Add content based on type
      if (typeof content === 'string') {
        // If content is a string and has a modal title, set up the aria-labelledby relationship
        modalEl.innerHTML = content;
        
        // If there's a title in the content, add an ID to it for accessibility
        const titleElement = modalEl.querySelector('.modal-header h3, .modal-header h2');
        if (titleElement && overlay.hasAttribute('aria-labelledby')) {
          titleElement.id = overlay.getAttribute('aria-labelledby');
        }
      } else if (content instanceof HTMLElement) {
        modalEl.appendChild(content);
        
        // Similar title handling for HTML element content
        const titleElement = content.querySelector('.modal-header h3, .modal-header h2');
        if (titleElement && overlay.hasAttribute('aria-labelledby')) {
          titleElement.id = overlay.getAttribute('aria-labelledby');
        }
      }
      
      // Add close button if needed
      if (modalOptions.showCloseButton !== false) {
        const closeButton = document.createElement('button');
        closeButton.className = modalOptions.closeButtonClass;
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close dialog');
        modalEl.prepend(closeButton);
        
        closeButton.addEventListener('click', () => {
          this.close(modal);
        });
      }
      
      // Add to container
      overlay.appendChild(modalEl);
      this.container.appendChild(overlay);
      
      // Create modal object
      const modal = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        overlay,
        modal: modalEl,
        options: modalOptions,
        close: () => this.close(modal),
        previouslyFocused: this.previouslyFocused
      };
      
      // Add to active modals
      this.activeModals.push(modal);
      
      // Set up event listeners
      if (modalOptions.closeOnOverlayClick) {
        overlay.addEventListener('click', (event) => {
          if (event.target === overlay) {
            this.close(modal);
          }
        });
      }
      
      // Listen for escape key
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          this.close(modal);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      // Store the event handler for later removal
      modal.escapeHandler = handleEscape;
      
      // Trap focus within the modal
      this._setupFocusTrap(modal);
      
      // Add animation classes after a short delay (for transitions)
      setTimeout(() => {
        overlay.classList.add('active');
        modalEl.classList.add('active');
        
        // Focus the first focusable element
        this._focusFirstElement(modalEl);
      }, 10);
      
      // Execute onOpen callback if provided
      if (typeof modalOptions.onOpen === 'function') {
        modalOptions.onOpen(modalEl, modal);
      }
      
      return modal;
    } catch (error) {
      console.error('Error showing modal:', error);
      
      // If there's an error, create a simple error modal instead
      const errorModal = this._createErrorModal('Failed to display modal', error.message);
      return errorModal;
    }
  }
  
  /**
   * Create a simple error modal as a fallback
   * @private
   * @param {string} title - Error title
   * @param {string} message - Error message
   * @returns {Object} Modal instance
   */
  _createErrorModal(title, message) {
    const overlay = document.createElement('div');
    overlay.className = this.options.overlayClass;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'error-modal-title');
    
    const modalEl = document.createElement('div');
    modalEl.className = this.options.modalClass;
    modalEl.innerHTML = `
      <button class="${this.options.closeButtonClass}" aria-label="Close dialog">&times;</button>
      <div class="modal-content error-content">
        <div class="modal-header">
          <h3 id="error-modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary">OK</button>
        </div>
      </div>
    `;
    
    // Add to container
    overlay.appendChild(modalEl);
    this.container.appendChild(overlay);
    
    // Create modal object
    const modal = {
      id: 'error-modal',
      overlay,
      modal: modalEl,
      options: this.options,
      close: () => {
        overlay.remove();
        return true;
      }
    };
    
    // Set up event listeners
    const closeBtn = modalEl.querySelector(`.${this.options.closeButtonClass}`);
    const okBtn = modalEl.querySelector('.btn-primary');
    
    closeBtn.addEventListener('click', () => modal.close());
    okBtn.addEventListener('click', () => modal.close());
    
    // Show immediately
    overlay.classList.add('active');
    modalEl.classList.add('active');
    
    // Focus the OK button
    setTimeout(() => {
      okBtn.focus();
    }, 10);
    
    return modal;
  }
  
  /**
   * Set up a focus trap to keep focus within the modal
   * @private
   * @param {Object} modal - The modal object
   */
  _setupFocusTrap(modal) {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = modal.modal.querySelectorAll(focusableElements)[0];
    const focusableContent = modal.modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];
    
    modal.handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', modal.handleTabKey);
  }
  
  /**
   * Focus the first focusable element in the modal
   * @private
   * @param {HTMLElement} modalEl - The modal element
   */
  _focusFirstElement(modalEl) {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableContent = modalEl.querySelectorAll(focusableElements);
    
    if (focusableContent.length) {
      focusableContent[0].focus();
    } else {
      modalEl.focus();
    }
  }

  /**
   * Close a specific modal
   * @param {Object} modal - Modal to close
   * @returns {boolean} Success status
   */
  close(modal) {
    if (!modal || !this.activeModals.includes(modal)) {
      return false;
    }
    
    try {
      // Execute onBeforeClose callback if provided
      if (typeof modal.options.onBeforeClose === 'function') {
        // Allow preventing close
        const shouldClose = modal.options.onBeforeClose(modal.modal, modal);
        if (shouldClose === false) {
          return false;
        }
      }
      
      // Remove animation classes
      modal.overlay.classList.remove('active');
      modal.modal.classList.remove('active');
      
      // Remove event handlers
      if (modal.escapeHandler) {
        document.removeEventListener('keydown', modal.escapeHandler);
      }
      
      if (modal.handleTabKey) {
        document.removeEventListener('keydown', modal.handleTabKey);
      }
      
      // Store the previously focused element for restoration
      const previouslyFocused = modal.previouslyFocused;
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (modal.overlay.parentNode) {
          modal.overlay.parentNode.removeChild(modal.overlay);
        }
        
        // Remove from active modals
        this.activeModals = this.activeModals.filter(m => m !== modal);
        
        // Execute onClose callback if provided
        if (typeof modal.options.onClose === 'function') {
          modal.options.onClose(modal);
        }
        
        // Restore focus to the previously focused element
        if (previouslyFocused && previouslyFocused.focus) {
          // Wait a bit to ensure the DOM has settled
          setTimeout(() => {
            previouslyFocused.focus();
            
            // Ensure the element can actually receive focus
            if (document.activeElement !== previouslyFocused) {
              document.body.focus();
            }
          }, 10);
        }
        
        // If there are still active modals, focus should go to the top-most one
        if (this.activeModals.length > 0) {
          const topModal = this.activeModals[this.activeModals.length - 1];
          this._focusFirstElement(topModal.modal);
        }
      }, modal.options.animationDuration);
      
      return true;
    } catch (error) {
      console.error('Error closing modal:', error);
      
      // In case of error, force removal from DOM and cleanup
      if (modal.overlay.parentNode) {
        modal.overlay.parentNode.removeChild(modal.overlay);
      }
      
      this.activeModals = this.activeModals.filter(m => m !== modal);
      
      return false;
    }
  }

  /**
   * Close all active modals
   * @returns {boolean} Success status
   */
  closeAll() {
    if (this.activeModals.length === 0) {
      return false;
    }
    
    // Clone the array to avoid issues during iteration
    const modals = [...this.activeModals];
    
    // Close each modal
    modals.forEach(modal => {
      this.close(modal);
    });
    
    return true;
  }

  /**
   * Show a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} User's choice
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      // Default options
      const dialogOptions = {
        title: 'Confirm',
        confirmText: 'OK',
        cancelText: 'Cancel',
        ...options
      };
      
      // Create content
      const content = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${dialogOptions.title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel">${dialogOptions.cancelText}</button>
            <button class="btn btn-confirm">${dialogOptions.confirmText}</button>
          </div>
        </div>
      `;
      
      // Show modal
      const modal = this.show(content, {
        closeOnOverlayClick: false,
        maxWidth: 400,
        ...dialogOptions
      });
      
      // Set up event listeners
      const confirmBtn = modal.modal.querySelector('.btn-confirm');
      const cancelBtn = modal.modal.querySelector('.btn-cancel');
      
      confirmBtn.addEventListener('click', () => {
        modal.close();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.close();
        resolve(false);
      });
      
      // Focus confirm button
      setTimeout(() => {
        confirmBtn.focus();
      }, 100);
    });
  }

  /**
   * Show an alert dialog
   * @param {string} message - Alert message
   * @param {Object} options - Dialog options
   * @returns {Promise<void>} Resolves when closed
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      // Default options
      const dialogOptions = {
        title: 'Alert',
        confirmText: 'OK',
        ...options
      };
      
      // Create content
      const content = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${dialogOptions.title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-confirm">${dialogOptions.confirmText}</button>
          </div>
        </div>
      `;
      
      // Show modal
      const modal = this.show(content, {
        closeOnOverlayClick: false,
        maxWidth: 400,
        ...dialogOptions
      });
      
      // Set up event listener
      const confirmBtn = modal.modal.querySelector('.btn-confirm');
      
      confirmBtn.addEventListener('click', () => {
        modal.close();
        resolve();
      });
      
      // Focus confirm button
      setTimeout(() => {
        confirmBtn.focus();
      }, 100);
    });
  }

  /**
   * Show a prompt dialog
   * @param {string} message - Prompt message
   * @param {string} defaultValue - Default input value
   * @param {Object} options - Dialog options
   * @returns {Promise<string|null>} User's input or null if canceled
   */
  prompt(message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
      // Default options
      const dialogOptions = {
        title: 'Prompt',
        confirmText: 'OK',
        cancelText: 'Cancel',
        inputType: 'text',
        ...options
      };
      
      // Create content
      const content = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${dialogOptions.title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
            <input type="${dialogOptions.inputType}" class="modal-input" value="${this._escapeHtml(defaultValue)}">
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel">${dialogOptions.cancelText}</button>
            <button class="btn btn-confirm">${dialogOptions.confirmText}</button>
          </div>
        </div>
      `;
      
      // Show modal
      const modal = this.show(content, {
        closeOnOverlayClick: false,
        maxWidth: 400,
        ...dialogOptions
      });
      
      // Set up event listeners
      const confirmBtn = modal.modal.querySelector('.btn-confirm');
      const cancelBtn = modal.modal.querySelector('.btn-cancel');
      const input = modal.modal.querySelector('.modal-input');
      
      confirmBtn.addEventListener('click', () => {
        modal.close();
        resolve(input.value);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.close();
        resolve(null);
      });
      
      // Handle enter key
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          modal.close();
          resolve(input.value);
        }
      });
      
      // Focus input
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    });
  }

  /**
   * Show a custom form dialog
   * @param {Object} formConfig - Form configuration
   * @param {Object} options - Dialog options
   * @returns {Promise<Object|null>} Form values or null if canceled
   */
  form(formConfig, options = {}) {
    return new Promise((resolve) => {
      // Default options
      const dialogOptions = {
        title: 'Form',
        confirmText: 'Save',
        cancelText: 'Cancel',
        ...options
      };
      
      // Generate form HTML
      let formHtml = '<form class="modal-form">';
      
      formConfig.fields.forEach(field => {
        const id = `form-field-${field.name}`;
        
        formHtml += `<div class="form-group">`;
        
        // Add label if specified
        if (field.label) {
          formHtml += `<label for="${id}">${field.label}</label>`;
        }
        
        // Add field based on type
        switch (field.type) {
          case 'text':
          case 'email':
          case 'password':
          case 'number':
          case 'date':
          case 'time':
          case 'tel':
          case 'url':
            formHtml += `
              <input 
                type="${field.type}" 
                id="${id}" 
                name="${field.name}" 
                ${field.value ? `value="${this._escapeHtml(field.value)}"` : ''}
                ${field.placeholder ? `placeholder="${this._escapeHtml(field.placeholder)}"` : ''}
                ${field.required ? 'required' : ''}
              >
            `;
            break;
          
          case 'textarea':
            formHtml += `
              <textarea 
                id="${id}" 
                name="${field.name}" 
                ${field.placeholder ? `placeholder="${this._escapeHtml(field.placeholder)}"` : ''}
                ${field.required ? 'required' : ''}
                rows="${field.rows || 3}"
              >${field.value || ''}</textarea>
            `;
            break;
          
          case 'select':
            formHtml += `
              <select 
                id="${id}" 
                name="${field.name}"
                ${field.required ? 'required' : ''}
              >
            `;
            
            if (field.placeholder) {
              formHtml += `<option value="" ${!field.value ? 'selected' : ''}>${field.placeholder}</option>`;
            }
            
            if (field.options) {
              field.options.forEach(option => {
                if (typeof option === 'object') {
                  formHtml += `
                    <option 
                      value="${this._escapeHtml(option.value)}" 
                      ${field.value === option.value ? 'selected' : ''}
                    >
                      ${this._escapeHtml(option.label)}
                    </option>
                  `;
                } else {
                  formHtml += `
                    <option 
                      value="${this._escapeHtml(option)}" 
                      ${field.value === option ? 'selected' : ''}
                    >
                      ${this._escapeHtml(option)}
                    </option>
                  `;
                }
              });
            }
            
            formHtml += `</select>`;
            break;
          
          case 'checkbox':
            formHtml += `
              <div class="checkbox-wrapper">
                <input 
                  type="checkbox" 
                  id="${id}" 
                  name="${field.name}" 
                  ${field.value ? 'checked' : ''}
                >
                <label for="${id}">${field.checkboxLabel || ''}</label>
              </div>
            `;
            break;
          
          case 'radio':
            if (field.options) {
              field.options.forEach((option, index) => {
                const optionId = `${id}-${index}`;
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                
                formHtml += `
                  <div class="radio-wrapper">
                    <input 
                      type="radio" 
                      id="${optionId}" 
                      name="${field.name}" 
                      value="${this._escapeHtml(optionValue)}"
                      ${field.value === optionValue ? 'checked' : ''}
                    >
                    <label for="${optionId}">${this._escapeHtml(optionLabel)}</label>
                  </div>
                `;
              });
            }
            break;
        }
        
        // Add help text if specified
        if (field.helpText) {
          formHtml += `<div class="form-help-text">${field.helpText}</div>`;
        }
        
        formHtml += `</div>`;
      });
      
      formHtml += '</form>';
      
      // Create content
      const content = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${dialogOptions.title}</h3>
          </div>
          <div class="modal-body">
            ${formHtml}
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel">${dialogOptions.cancelText}</button>
            <button class="btn btn-confirm">${dialogOptions.confirmText}</button>
          </div>
        </div>
      `;
      
      // Show modal
      const modal = this.show(content, {
        closeOnOverlayClick: false,
        maxWidth: 600,
        ...dialogOptions
      });
      
      // Set up event listeners
      const confirmBtn = modal.modal.querySelector('.btn-confirm');
      const cancelBtn = modal.modal.querySelector('.btn-cancel');
      const form = modal.modal.querySelector('.modal-form');
      
      confirmBtn.addEventListener('click', () => {
        // Check form validity
        const isValid = form.checkValidity();
        
        if (!isValid) {
          form.reportValidity();
          return;
        }
        
        // Collect form values
        const formData = new FormData(form);
        const values = {};
        
        formConfig.fields.forEach(field => {
          if (field.type === 'checkbox') {
            values[field.name] = formData.has(field.name);
          } else {
            values[field.name] = formData.get(field.name);
          }
        });
        
        modal.close();
        resolve(values);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.close();
        resolve(null);
      });
      
      // Handle form submission
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        confirmBtn.click();
      });
      
      // Focus first input
      setTimeout(() => {
        const firstInput = form.querySelector('input, select, textarea');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} html - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(html) {
    if (typeof html !== 'string') {
      return html;
    }
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
}

// Create global instance
const modalManager = new ModalManager();