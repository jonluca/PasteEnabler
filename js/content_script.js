/**
 * Function invoked on every load of the script
 */
function checkCopyAndPaste() {
  stopPropagationOfType('paste');
  stopPropagationOfType('copy');
}

/**
 * Stops propagation of an event to other event listeners, while still allowing the event to complete in its native
 * context
 * @param {string} type - the event type, i.e. 'paste', 'keyup', etc
 */
function stopPropagationOfType(type) {
  window.addEventListener(type, function (event) {
    event.stopPropagation();
  }, true);
}

checkCopyAndPaste();
