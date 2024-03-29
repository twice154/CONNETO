var startWindow;
//createConnection();
function createWindow(state) {
    chrome.app.window.create('index.html', {
        state: state,
        bounds: {
            // CONNETO: change window size
            width: 450,
            height: 450
            // CONNETO: change window size
        }
    }, function(window) {
        // workaround:
        // state = 'normal' in some cases not work (e.g. starting app from 'chrome://extensions' always open window in fullscreen mode)
        // it requires manually restoring window state to 'normal'
        startWindow = window;
        if (state == 'normal') {
            setTimeout(function() { window.restore(); }, 1000);
        }
        window.onClosed.addListener(closeConnection);
        //window.contentWindow.createConnection();
        createConnection();
        //window.contentWindow.$('#showLoginView').on('click', showLoginModal);
    });
}

chrome.app.runtime.onLaunched.addListener(function() {
    console.log('Chrome app runtime launched.');
    var windowState = 'normal';


    if (chrome.storage) {
        // load stored window state
        chrome.storage.sync.get('windowState', function(item) {
            windowState = (item && item.windowState)
                ? item.windowState
                : windowState;
            createWindow(windowState);
        });
    } else {
        createWindow(windowState);
    }
});

/*chrome.runtime.onSuspend.addListener(function () {
    // Do some simple clean-up tasks.
    chrome.sockets.tcp.getSockets(function (sockets) {
        sockets.forEach(function (sock) {
            chrome.sockets.tcp.close(sock.socketId);
        });
    })
});

chrome.app.window.onClosed.addListener(function () {
    chrome.sockets.tcp.getSockets(function (sockets) {
        sockets.forEach(function (sock) {
            chrome.sockets.tcp.close(sock.socketId);
        });
    })
})*/
