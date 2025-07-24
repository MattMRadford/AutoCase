import nlp from 'compromise';


// Add at the top with other variables
let usageTracker = {
  count: 0,
  reviewRequested: false,
  
};

// Load existing usage data when content script loads
chrome.storage.local.get(['usageCount', 'reviewRequested'], (data) => {
  usageTracker.count = data.usageCount || 0;
  usageTracker.reviewRequested = data.reviewRequested || false; 
});

// Add this function to content.js
function trackUsageAndPromptReview() {
  usageTracker.count++;
  
  // Save updated count
  chrome.storage.local.set({ usageCount: usageTracker.count });
  
  // Show review prompt after 3 successful uses AND at least 1 day after install
  
  
  if (usageTracker.count === 3 && !usageTracker.reviewRequested) {
    setTimeout(() => showReviewPrompt(), 1000); // Small delay so user sees the conversion first
    usageTracker.reviewRequested = true;
    chrome.storage.local.set({ reviewRequested: true });
  }
}

function showReviewPrompt() {
  // Check if prompt already exists
  if (document.getElementById('autocase-review-banner')) return;
  
  const reviewBanner = document.createElement('div');
  reviewBanner.id = 'autocase-review-banner';
  reviewBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #007acc, #0066bb);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,122,204,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      max-width: 320px;
      animation: slideInReview 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255,255,255,0.2);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 20px; margin-right: 8px;">✨</span>
        <strong style="font-size: 15px;">Loving AutoCase?</strong>
      </div>
      <div style="margin-bottom: 12px; opacity: 0.95; line-height: 1.4;">
        You've used AutoCase 3 times! Help other developers discover it with a quick review.
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="review-yes" style="
          background: white;
          color: #007acc;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: transform 0.1s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          ⭐ Leave Review
        </button>
        <button id="review-later" style="
          background: rgba(255,255,255,0.15);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        ">
          Later
        </button>
        <button id="review-never" style="
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: none;
          padding: 8px;
          cursor: pointer;
          font-size: 16px;
          border-radius: 4px;
        " title="Don't ask again">
          ✕
        </button>
      </div>
    </div>
    <style>
      @keyframes slideInReview {
        from { 
          transform: translateX(400px) scale(0.8); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0) scale(1); 
          opacity: 1; 
        }
      }
    </style>
  `;
  
  document.body.appendChild(reviewBanner);
  
  // Get your actual extension ID from Chrome Web Store
  const extensionId = 'inmghklhnephcaocldmdbikmipomhjnd'; // Replace with your actual ID
  
  // Event listeners
  document.getElementById('review-yes').onclick = () => {
    window.open(`https://chromewebstore.google.com/detail/inmghklhnephcaocldmdbikmipomhjnd/reviews`, '_blank');
    // Track that user clicked review
    chrome.storage.local.set({ reviewClicked: true });
  };
  
  document.getElementById('review-later').onclick = () => {
    reviewBanner.remove();
    // Reset to ask again after 10 more uses
    usageTracker.count = -7; // So they'll be prompted again at 3 uses from now
    usageTracker.reviewRequested = false;
    chrome.storage.local.set({ 
      usageCount: -7, 
      reviewRequested: false 
    });
  };
  
  document.getElementById('review-never').onclick = () => {
    reviewBanner.remove();
    chrome.storage.local.set({ reviewRequested: true, reviewNeverAsk: true });
  };
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (reviewBanner.parentNode) {
      reviewBanner.remove();
    }
  }, 15000);
}

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
    chrome.storage.sync.get('autocaseEnabled', (data) => {
        if (!(data.autocaseEnabled)) return;
        const mode = data.autocaseMode || 'title';

        let obj = getSelectedText().then(applyCaseChange);
    });

    
    
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
                chrome.storage.sync.get(['autocaseEnabled', 'autocaseMode'], (data) => {
                    if (!(data.autocaseEnabled)) return;
                    const mode = data.autocaseMode || 'title';

                    let obj = getSelectedText().then(applyCaseChange);
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
        return smartTitleCase(selectedText);
    }
    else if (mode == "sentence") {
        return toSentenceCase(selectedText);
    }
    else if (mode == "snake") {
        return toSnakeCase(selectedText);
    }
    else {
        return toCamelCase(selectedText);
    }
}

function smartTitleCase(text) {


  const doc = nlp(text);
  const allTerms = doc.terms().json().flatMap(d => d.terms); // flatten all chunks

  return allTerms
    .map((term, i, arr) => {
      const word = term.text;
      const tag = term.tags.join(',');

      const isFirstOrLast = i === 0 || i === arr.length - 1;
      const isImportant = /Noun|Verb|Adjective|Adverb|Pronoun/.test(tag);

      if (isFirstOrLast || isImportant) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else {
        return word.toLowerCase();
      }
    })
    .join(' ');
}



function toTitleCase(str) {
    let new_str = str.toLowerCase();
    return new_str.replace(/\b\w+/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);

    })
  
}

function toSentenceCase(text) {
  return text
    .match(/[^.!?]+[.!?]*\s*/g) // Split into sentence-like chunks
    .map(sentence => {
      const trimmed = sentence.trimStart();
      if (!trimmed) return '';
      return (
        trimmed.charAt(0).toUpperCase() +
        trimmed.slice(1).toLowerCase()
      );
    })
    .join('');
}

function toSnakeCase(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .split(/\s+/)
    .join('_');
}

function toCamelCase(text) {
  const words = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);

  return words[0] + words.slice(1).map(capitalize).join('');
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
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
    trackUsageAndPromptReview();
}