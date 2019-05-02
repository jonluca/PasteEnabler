function checkCopyAndPaste() {
  stopPropagationOfType('paste');
  stopPropagationOfType('copy');
}

function stopPropagationOfType() {
  window.addEventListener(type, function (event) {
    event.stopPropagation();
  }, true);
}

checkCopyAndPaste();
