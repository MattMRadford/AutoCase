
function getMode() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("autocaseMode", (result) => {
      resolve(result.autocaseMode || "title");
    });
  });
}

const checkEditor = setInterval(() => {
  const iframe = document.querySelector("#editor_ifr");
  if (iframe?.contentDocument?.readyState === "complete") {
    listenInsideIframe();
    clearInterval(checkEditor);
  }
}, 500);


document.addEventListener("mouseup", () => {
    console.log("Mouseup fired");

    getSelectedText();
});

function getSelectedText() {
    const active = document.activeElement;
    let selection = "";
    const shadowRoot = active?.shadowRoot;
    const innerTextArea = shadowRoot?.querySelector('textarea');

    if (innerTextArea) {
        selection = innerTextArea.value.substring(innerTextArea.selectionStart, innerTextArea.selectionEnd);
        getMode().then((mode) => {
            const transformed = applyCasing(selection, mode);
            if (transformed) {
                console.log("Reddit editable title selected: ", selection);
                console.log("Transformed to ", mode, " :", transformed);
            }
        });
    }
    
   else if (active && (active.tagName == "INPUT" || active.tagName == "TEXTAREA")) {
        selection = active.value.substring(active.selectionStart, active.selectionEnd);
        
        getMode().then((mode) => {
            const transformed = applyCasing(selection, mode);
            if (transformed) {
                console.log("You selected: ", selection, " in an input/text_area");
                console.log("Transformed to ", mode, " :", transformed);
            }
        });
        
    }
    else if (active?.closest('[contenteditable="true"]')) {
        selection = window.getSelection()?.toString().trim();
        
        getMode().then((mode) => {
            const transformed = applyCasing(selection, mode);
            if (transformed) {
                console.log("You selected:", selection, "in an editable span (Reddit)");
                console.log("Transformed to ", mode, " :", transformed);
            }
        });
    }

    else {
        selection = window.getSelection()?.toString().trim();
        getMode().then((mode) => {
            const transformed = applyCasing(selection, mode);
            if (transformed) {
                console.log("You selected: ", selection);
                console.log("Transformed to ", mode, " :", transformed);
            }
        });
        
    }
    
   


}

function listenInsideIframe() {
  const iframe = document.querySelector("#editor_ifr");
  const doc = iframe?.contentDocument || iframe?.contentWindow?.document;

  if (doc) {
    doc.addEventListener("mouseup", () => {
      const selected = doc.getSelection()?.toString().trim();
      if (selected) {
        console.log("You selected inside TinyMCE:", selected);
      }
    });
  }
}

function applyCasing(selectedText, mode) {
    if (selectedText.length == 0) return;
    if (mode == "upper") {
        return selectedText.toUpperCase();
    }
    else if (mode == "lower") {
        return selectedText.toLowerCase();
    }
    else if (mode == "title") {
        return toTitleCase(selectedText);
    }
    else if (mode == "sentence") {
        return toSentenceCase(selectedText);
    }
}

function toTitleCase(str) {
    let new_str = str.toLowerCase();
    return new_str.replace(/\b\w+/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);

    })
  
}

function toSentenceCase(str) {
  const trimmed = str.trim().toLowerCase();
  let ret = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if (!/[.!?]$/.test(ret)) ret += '.';
  return ret;
}



