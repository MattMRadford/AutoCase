chrome.commands.onCommand.addListener((command) => {
  if (command.startsWith('set-')) {
    const mode = command.replace('set-', '').replace('-case', '');
    chrome.storage.sync.set({ autocaseMode: mode });
    showDesktopToast(`Mode changed to ${mode}`);
  }

  if (command === 'toggle-autocase') {
    chrome.storage.sync.get('autocaseEnabled', (data) => {
      const newState = !data.autocaseEnabled;
      chrome.storage.sync.set({ autocaseEnabled: newState });
      showDesktopToast(`AutoCase ${newState ? 'enabled' : 'disabled'}`);

    });
  }
});

function showDesktopToast(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('images/icon48.png'), 
    title: 'AutoCase',
    message: message
  });
}