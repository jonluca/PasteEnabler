function checkCopyAndPaste() {
  stopPropagationOfType('paste');
  stopPropagationOfType('copy');
}

function stopPropagationOfType(type) {
  window.addEventListener(type, function (event) {
    event.stopPropagation();
  }, true);
}

checkCopyAndPaste();
