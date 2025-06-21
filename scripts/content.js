
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
        console.log("Reddit editable title selected: ", selection);
    }
    
   if (active && (active.tagName == "INPUT" || active.tagName == "TEXTAREA")) {
        selection = active.value.substring(active.selectionStart, active.selectionEnd);
        console.log("You selected: ", selection, " in an input/text_area");
    }
    else if (active?.closest('[contenteditable="true"]')) {
        selection = window.getSelection()?.toString().trim();
        console.log("You selected:", selection, "in an editable span (Reddit)");
    }

    else {
        selection = window.getSelection()?.toString().trim();
        console.log("You selected: ", selection);
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


