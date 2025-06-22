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
    //applyCaseChange(obj);
    clearInterval(checkEditor);
  }
}, 500);

document.addEventListener("mouseup", () => {
    console.log("Mouseup fired");

    let obj = getSelectedText().then(applyCaseChange);
    
});

async function listenInsideIframe() {
    let obj = {
        type: '',
        element: null,
        text: ""
    }
    let mode = await getMode();
  const iframes = [...document.querySelectorAll('iframe')];
  iframes.forEach((iframe) => {
    try {
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const win = iframe.contentWindow;

        if (doc && win) {
            doc.addEventListener('mouseup', () => {
                const selected = win.getSelection()?.toString().trim();
                const anchor = win.getSelection().anchorNode;
                const isEdit = anchor?.parentElement?.closest('input, textarea, [contenteditable="true"]');
                if (selected) {
                    if (isEdit) {
                        console.log("You selected inside an editable iframe: ", selected);
                        let obj = {
                            type: 'iframe-edit',
                            element: isEdit,
                            text: applyCasing(selected, mode)
                        }
                        applyCaseChange(obj);
                    }
                    else {
                        let obj = {
                            type: 'iframe-nonedit',
                            element: iframe,
                            text: applyCasing(selected, mode)
                        }
                        console.log("You selected inside an iframe: ", selected);
                        applyCaseChange(obj);
                    }
                }
            });
        }
    }
    catch (err) {
        console.log("Cross-origin iframe or iframe not loaded yet...");
    }
  })

  
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

async function getSelectedText() {
    let obj =  {
        type: '',
        element: null,
        text: ""
    };

    let selection = "";
    const active = document.activeElement;
    const shadowRoot = active?.shadowRoot;
    const innerTextArea = shadowRoot?.querySelector('textarea, input');
    const editable = shadowRoot?.activeElement?.closest('[contenteditable="true"]') || 
        shadowRoot?.querySelector('[contenteditable="true"]');

    const mode = await getMode();

    if (active && (active.tagName == "INPUT" || active.tagName == "TEXTAREA")) {
        // normal input/textarea
        selection = active.value.substring(active.selectionStart, active.selectionEnd);

        const transformed = applyCasing(selection, mode);
        if (transformed) {
            console.log("Input field or textarea selected: ", selection);
            console.log("Transformed to ", mode, " :", transformed);
            obj = {
                type: 'input-textarea',
                element: active,
                text: transformed
            }
            return obj;
        }
    }
    else if (innerTextArea) {
        // shadowDOM input/textarea
        selection = innerTextArea.value.substring(innerTextArea.selectionStart, innerTextArea.selectionEnd);

        const transformed = applyCasing(selection, mode);
        if (transformed) {
            console.log("Input field or textarea selected within shadow DOM: ", selection);
            console.log("Transformed to ", mode, " :", transformed);
            obj = {
                type: 'shadow-input',
                element: innerTextArea,
                text: transformed
            }
            return obj;
        }
    }
    else if (editable) {
        // editable but in shadow DOM
        selection = shadowRoot.getSelection()?.toString().trim();
        
        const transformed = applyCasing(selection, mode);
        if (transformed) {
            console.log("Some editable field within shadow DOM: ", selection);
            console.log("Transformed to ", mode, " :", transformed);
            obj = {
                type: 'shadow-editable',
                element: editable,
                text: transformed
            }
            return obj;
         }
    }
    else if (active?.closest('[contenteditable="true"]')) {
        // editable text wrapped somewhere in contenteditable=true
        selection = window.getSelection()?.toString().trim();
        
        const transformed = applyCasing(selection, mode);
        if (transformed) {
            console.log("Some editable field: ", selection);
            console.log("Transformed to ", mode, " :", transformed);
            obj = {
                type: 'editable',
                element: active,
                text: transformed
            }
            return obj;
        }
    }
    else { 
        // non-editable text
        selection = window.getSelection()?.toString().trim();
        const transformed = applyCasing(selection, mode);
        if (transformed) {
            console.log("Some non-editable field: ", selection);
            console.log("Transformed to ", mode, " :", transformed);
            obj = {
                type: 'noneditable',
                element: active,
                text: transformed
            }
            return obj;
        }
    }

}

function applyCaseChange(object) {
    if (!object) return;
    const {type, element, text} = object;

    if (!element || text == "" || type == '') return;

    if (type == 'input-textarea' || type == 'shadow-input') {
        if (element.selectionStart != null) {
            const start = element.selectionStart;
            const end = element.selectionEnd;
            const before = element.value.slice(0, start);
            const after = element.value.slice(end);
            element.value = before + text + after;
            element.setSelectionRange(start, start + text.length);
        }
    }
    else if (type == 'editable' || type == 'shadow-editable' || type == 'iframe-edit' ) {
        const root = element.getRootNode?.() || document;
        const sel = root.getSelection?.();
        if (!sel || sel.rangeCount == 0) return;
        const success = document.execCommand?.('insertText', false, text);
        const range = sel.getRangeAt(0);
        if (!success) {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }
        
    }
    else {
        navigator.clipboard.writeText(text).then(() => {
            console.log("Copied to clipboard: ", text);
        })
    }
}