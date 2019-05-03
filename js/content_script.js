/**
 * Function invoked on every load of the script
 */
function checkCopyAndPaste() {
  stopPropagationOfType('paste');
  stopPropagationOfType('copy');
  stopPropagationOfType('contextmenu');
  stopPropagationOfType('onselectstart');
  const body = document.getElementsByTagName('body');
  if (body.length) {
    addStyle(body[0], 'user-select', 'text', true);
  }
}

/**
 * Adds the given CSS property and value to a DOM element.
 * @param {HTMLElement} element - element we are adding the CSS property to
 * @param {string} property - CSS property name, accepts hyphenated form (i.e. user-select rather than userSelect)
 * @param {string} value - CSS property value
 * @param {boolean} important - whether to add !important
 */
function addStyle(element, property, value, important) {
  //remove previously defined property
  if (element.style.setProperty) {
    element.style.setProperty(property, '');
  } else {
    element.style.setAttribute(property, '');
  }

  //insert the new style with all the old rules
  element.setAttribute('style', element.style.cssText +
    property + ':' + value + ((important) ? ' !important' : '') + ';');
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
