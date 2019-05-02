function checkCopyAndPaste() {
  window.addEventListener('paste', function (event) {
    event.stopPropagation();
  }, true);
}

checkCopyAndPaste();
