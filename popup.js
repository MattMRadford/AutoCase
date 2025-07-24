chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.autocaseMode) {
    const newMode = changes.autocaseMode.newValue;
    const radios = document.getElementsByName('mode');
    for (const radio of radios) {
      radio.checked = radio.value === newMode;
    }

    

  }

  if (namespace === 'sync' && changes.autocaseEnabled) {
    document.getElementById('toggle').checked = changes.autocaseEnabled.newValue;
  }
});


document.getElementById('toggle').addEventListener('change', (e) => {
        chrome.storage.sync.set({ autocaseEnabled: e.target.checked });
});

document.addEventListener("DOMContentLoaded", async () => {
    chrome.storage.sync.get({ autocaseEnabled: true }, (data) => {
        document.getElementById('toggle').checked = data.autocaseEnabled;
    });

    const form = document.getElementById("casingForm");
    const store = await chrome.storage.sync.get("autocaseMode");
    
    if (store.autocaseMode) {
        const selected = form.elements["mode"];
        for (const radio of selected) {
            if (radio.value == store.autocaseMode) {
                radio.checked = true;
                break;
            }
        }
    }
    
    form.addEventListener("change", () => {
        const selected = form.elements["mode"].value;
        chrome.storage.sync.set({autocaseMode: selected});
    });

    // Add review link handler here
    document.getElementById('rateLink').onclick = (e) => {
        e.preventDefault();
        chrome.tabs.create({ 
            url: "https://chromewebstore.google.com/detail/inmghklhnephcaocldmdbikmipomhjnd/reviews"
        });
    };
});



function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000); // Hide after 2 seconds
}
