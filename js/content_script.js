/**
 * Function invoked on every load of the script
 */
function checkCopyAndPaste() {
  // enables paste on all items
  stopPropagationOfType('paste');
  // enables copying any inputs or text
  stopPropagationOfType('copy');
  // enables cutting text from an input
  stopPropagationOfType('cut');
  // enables drag + drop of text into input
  stopPropagationOfType('drop');
  // enables scrolling
  stopPropagationOfType('scroll');
  stopPropagationOfType('mousewheel');
    // enables text selection
  stopPropagationOfType('selectstart');
  stopPropagationOfType('touchstart');
  stopPropagationOfType('touchend');
  stopPropagationOfType('dragstart');
  stopPropagationOfType('dragend');
  stopPropagationOfType('mousedown');

    // enables right click context menu
  stopPropagationOfType('contextmenu');


  // Enables autocomplete on all elements that have it
  const autocompleteDisabled = document.querySelectorAll('[autocomplete]');
  for (const elem of autocompleteDisabled) {
    elem.setAttribute('autocomplete', 'on');
  }


  // Finds all elements and adds the user-select CSS property as text
  // note - this is a *little* hacky, but it's the only way I've found to get it to work, since user-select is not
  // inherited
  const elements = document.body.getElementsByTagName("*");
  if (elements.length) {
    for (const elem of elements) {
      addStyle(elem, 'user-select', 'text', true);
    }
  }


  // Enables dragging on all elements that have it
  const draggableDisabled = document.querySelectorAll('[draggable]');
  for (const elem of draggableDisabled) {
    elem.setAttribute('draggable', 'auto');
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
