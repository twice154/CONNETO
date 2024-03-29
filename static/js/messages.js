var callbacks = {}
var callbacks_ids = 1;

/**
 * var sendMessage - Sends a message with arguments to the NaCl module
 *
 * @param  {String} method A named method
 * @param  {(String|Array)} params An array of options or a signle string
 * @return {void}        The NaCl module calls back trought the handleMessage method
 */
var sendMessage = function(method, params) {
    return new Promise(function(resolve, reject) {
        var id = callbacks_ids++;
        callbacks[id] = {'resolve': resolve, 'reject': reject};

        common.naclModule.postMessage({
            'callbackId': id,
            'method': method,
            'params': params
        });
    });
}

/**
 * handleMessage - Handles messages from the NaCl module
 *
 * @param  {Object} msg An object given by the NaCl module 
 * @return {void}
 */
function handleMessage(msg) {
    if (msg.data.callbackId && callbacks[msg.data.callbackId]) {  // if it's a callback, treat it as such
        callbacks[msg.data.callbackId][msg.data.type](msg.data.ret);
        delete callbacks[msg.data.callbackId]
    } else {  // else, it's just info, or an event
        console.log('%c[messages.js, handleMessage]', 'color:gray;', 'Message data: ', msg.data)
        if(msg.data === 'streamTerminated') {  // if it's a recognized event, notify the appropriate function
            $('#loadingSpinner').css('display', 'none'); // This is a fallback for RTSP handshake failing, which immediately terminates the stream.
            $('body').css('backgroundColor', '#282C38');

            // Release our keep awake request
            chrome.power.releaseKeepAwake();

            api.refreshServerInfo().then(function (ret) {  // refresh the serverinfo to acknowledge the currently running app
                api.getAppList().then(function (appList) {
                    appList.forEach(function (app) {
                        //stylizeBoxArt(api, app.id);  // and reapply stylization to indicate what's currently running
                    });
                });
                //CONNETO: return to start menu when game has been terminated
                //showApps(api);
                showHostsAndSettingsMode();
                //CONNETO: return to start menu when game has been terminated

                isInGame = false;

                // restore main window from 'fullscreen' to 'normal' mode (if required)
                (windowState == 'normal') && chrome.app.window.current().restore();
            });

        } else if(msg.data === 'Connection Established') {
            $('#loadingSpinner').css('display', 'none');
            $('body').css('backgroundColor', 'black');

            // Keep the display awake while streaming
            chrome.power.requestKeepAwake("display");
        } else if(msg.data.indexOf('ProgressMsg: ') === 0) {
            $('#loadingMessage').text(msg.data.replace('ProgressMsg: ', ''));
        } else if(msg.data.indexOf('TransientMsg: ') === 0) {
            snackbarLog(msg.data.replace('TransientMsg: ', ''));
        } else if(msg.data.indexOf('DialogMsg: ') === 0) {
            // FIXME: Really use a dialog
            snackbarLogLong(msg.data.replace('DialogMsg: ', ''));
        } else if(msg.data === 'displayVideo') {
            $("#listener").addClass("fullscreen");
        }
    }
}
