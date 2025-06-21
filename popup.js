document.addEventListener("DOMContentLoaded", async () => {
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
    })
});