var hosts = {};  // hosts is an associative array of NvHTTP objects, keyed by server UID
var activePolls = {};  // hosts currently being polled.  An associated array of polling IDs, keyed by server UID
var pairingCert;
var myUniqueid;
var api;  // `api` should only be set if we're in a host-specific screen. on the initial screen it should always be null.
var isInGame = false; // flag indicating whether the game stream started
var windowState = 'normal'; // chrome's windowState, possible values: 'normal' or 'fullscreen'

// CONNETO: variables to use
var networkSetting = {};
var startOption = {};
// CONNETO: variables to use

console.log();
// Called by the common.js module.
function attachListeners() {
    changeUiModeForNaClLoad();

    //CONNETO: removing unnecessaries
    //$('.resolutionMenu li').on('click', saveResolution);
    //$('.framerateMenu li').on('click', saveFramerate);
    //$('#bitrateSlider').on('input', updateBitrateField); // input occurs every notch you slide
    //$('#bitrateSlider').on('change', saveBitrate); //FIXME: it seems not working
    //$("#remoteAudioEnabledSwitch").on('click', saveRemoteAudio);
    //CONNETO: removing unnecessaries

    //$('#addHostCell').on('click', addHost);
    //$('#backIcon').on('click', showHostsAndSettingsMode);
    //$('#quitCurrentApp').on('click', stopGameWithConfirmation);

    // CONNETO: jQuery handler ���
    $('#showLoginView').on('click', showLoginModal);
    // CONNETO: jQuery handler ���
    $(window).resize(fullscreenNaclModule);
    if(chrome.app.window.current()){
        chrome.app.window.current().onMaximized.addListener(fullscreenChromeWindow);
    }
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        chrome.app.window.current().onClosed.addListener(function () {
            console.log("This won't appear anywhere since (this.)console doesn't exist anymore");
            backgroundPage.console.log("This will appear in the background page console, which you can open from the Extensions settings page");
            sendMsgtoCentralServer({sdfijdsfiodsfjsf:"asdadsdsa", sdfsdfdfsfds: "sdfsdfioe4wweui"});
        });
    });
}

function fullscreenChromeWindow() {
    // when the user clicks the maximize button on the window,
    // FIRST restore it to the previous size, then fullscreen it to the whole screen
    // this prevents the previous window size from being 'maximized',
    // and allows us to functionally retain two window sizes
    // so that when the user hits `esc`, they go back to the "restored" size,
    // instead of "maximized", which would immediately go to fullscreen
    chrome.app.window.current().restore();
    chrome.app.window.current().fullscreen();
}

function loadWindowState() {
    if (!chrome.storage) { return; }

    chrome.storage.sync.get('windowState', function(item) {
        // load stored window state
        windowState = (item && item.windowState)
            ? item.windowState
            : windowState;

        // subscribe to chrome's windowState events
        if(chrome.app.window.current()){
            chrome.app.window.current().onFullscreened.addListener(onFullscreened);
            chrome.app.window.current().onBoundsChanged.addListener(onBoundsChanged);
        }
    });
}

function onFullscreened() {
    if (!isInGame && windowState == 'normal') {
        storeData('windowState', 'fullscreen', null);
        windowState = 'fullscreen';
    }
}

function onBoundsChanged() {
    if (!isInGame && windowState == 'fullscreen') {
        storeData('windowState', 'normal', null);
        windowState = 'normal';
    }
}

function changeUiModeForNaClLoad() {
    // CONNETO: ȭ����ȯ ���� �ڵ����
    //$('#main-navigation').children().hide();
    $("#main-content").children().not("#listener, #naclSpinner").hide();
    $('#naclSpinnerMessage').text('Loading Moonlight plugin...');
    $('#naclSpinner').css('display', 'inline-block');
}

function startPollingHosts() {
    for(var hostUID in hosts) {
        beginBackgroundPollingOfHost(hosts[hostUID]);
    }
}

function stopPollingHosts() {
    for(var hostUID in hosts) {
        stopBackgroundPollingOfHost(hosts[hostUID]);
    }
}

function restoreUiAfterNaClLoad() {
    //$('#main-navigation').children().not("#quitCurrentApp").show();
    //$("#main-content").children().not("#listener, #naclSpinner, #game-grid").show();
    //CONNETO
    $("#main-content").children().not("#listener, #naclSpinner").show();
    //CONNETO
    $('#naclSpinner').hide();
    $('#loadingSpinner').css('display', 'none');
    showHostsAndSettingsMode();

    findNvService(function (finder, opt_error) {
        if (finder.byService_['_nvstream._tcp']) {
            var ips = Object.keys(finder.byService_['_nvstream._tcp']);
            for (var i in ips) {
                var ip = ips[i];
                if (finder.byService_['_nvstream._tcp'][ip]) {
                    var mDnsDiscoveredHost = new NvHTTP(ip, myUniqueid);
                    mDnsDiscoveredHost.pollServer(function(returneMdnsDiscoveredHost) {
                        // Just drop this if the host doesn't respond
                        if (!returneMdnsDiscoveredHost.online) {
                            return;
                        }

                        if (hosts[returneMdnsDiscoveredHost.serverUid] != null) {
                            // if we're seeing a host we've already seen before, update it for the current local IP.
                            hosts[returneMdnsDiscoveredHost.serverUid].address = returneMdnsDiscoveredHost.address;
                        } else {
                            beginBackgroundPollingOfHost(returneMdnsDiscoveredHost);
                            //addHostToGrid(returneMdnsDiscoveredHost, true);
                            //CONNETO: add the code saving host info in hosts
                            hosts[returneMdnsDiscoveredHost.serverUid] = returneMdnsDiscoveredHost;    
                            //CONNETO: add the code saving host info in hosts
                            //TODO: discern normal host with the Mdns host
                            //      There;s no problem with it now, but someday it might be
                        }
                    });
                }
            }
        }
    });
}
// CONNETO: removing unnecessary uis


//CONNETO: removing unnecessary ui part
function beginBackgroundPollingOfHost(host) {
    if (host.online) {
        //$("#hostgrid-" + host.serverUid).removeClass('host-cell-inactive');
        // The host was already online. Just start polling in the background now.
        activePolls[host.serverUid] = window.setInterval(function() {
            // every 5 seconds, poll at the address we know it was live at
            host.pollServer(function () {
                if (host.online) {
                    //$("#hostgrid-" + host.serverUid).removeClass('host-cell-inactive');
                    console.log("online: " + host.hostname)
                } else {
                    //$("#hostgrid-" + host.serverUid).addClass('host-cell-inactive');
                    console.log("offline: " + host.hostname)
                }
            });
        }, 5000);
    } else {
        //$("#hostgrid-" + host.serverUid).addClass('host-cell-inactive');
        // The host was offline, so poll immediately.
        host.pollServer(function () {
            if (host.online) {
                //$("#hostgrid-" + host.serverUid).removeClass('host-cell-inactive');
                console.log("online: " + host.hostname);
            } else {
                //$("#hostgrid-" + host.serverUid).addClass('host-cell-inactive');
                console.log("offline: " + host.hostname);
            }

            // Now start background polling
            activePolls[host.serverUid] = window.setInterval(function() {
                // every 5 seconds, poll at the address we know it was live at
                host.pollServer(function () {
                    if (host.online) {
                        //$("#hostgrid-" + host.serverUid).removeClass('host-cell-inactive');
                        console.log("online: " + host.hostname);
                    } else {
                        //$("#hostgrid-" + host.serverUid).addClass('host-cell-inactive');
                        console.log("offline: " + host.hostname);
                    }
                });
            }, 5000);
        });
    }
}

function stopBackgroundPollingOfHost(host) {
  console.log('%c[index.js, backgroundPolling]', 'color: green;', 'Stopping background polling of host ' + host.serverUid + '\n', host, host.toString()); //Logging both object (for console) and toString-ed object (for text logs)
  window.clearInterval(activePolls[host.serverUid]);
  delete activePolls[host.serverUid];
}

function snackbarLog(givenMessage) {
    console.log('%c[index.js, snackbarLog]', 'color: green;', givenMessage);
    var data = {
        message: givenMessage,
        timeout: 2000
    };
    document.querySelector('#snackbar').MaterialSnackbar.showSnackbar(data);
}

function snackbarLogLong(givenMessage) {
    console.log('%c[index.js, snackbarLog]', 'color: green;', givenMessage);
    var data = {
        message: givenMessage,
        timeout: 5000
    };
    document.querySelector('#snackbar').MaterialSnackbar.showSnackbar(data);
}
//CONNETO: removing unnecessaries
/*function updateBitrateField() {
    $('#bitrateField').html($('#bitrateSlider').val() + " Mbps");
    saveBitrate();
}*/
//CONNETO: removing unnecessaries

function moduleDidLoad() {
    // load the HTTP cert and unique ID if we have one.
    chrome.storage.sync.get('cert', function(savedCert) {
        if (savedCert.cert != null) { // we have a saved cert
            pairingCert = savedCert.cert;
        }

        chrome.storage.sync.get('uniqueid', function(savedUniqueid) {
            if (savedUniqueid.uniqueid != null) { // we have a saved uniqueid
                myUniqueid = savedUniqueid.uniqueid;
            } else {
                myUniqueid = uniqueid();
                storeData('uniqueid', myUniqueid, null);
            }

            if (!pairingCert) { // we couldn't load a cert. Make one.
                console.warn('%c[index.js, moduleDidLoad]', 'color: green;', 'Failed to load local cert. Generating new one');
                sendMessage('makeCert', []).then(function (cert) {
                    storeData('cert', cert, null);
                    pairingCert = cert;
                    console.info('%c[index.js, moduleDidLoad]', 'color: green;', 'Generated new cert:', cert);
                }, function (failedCert) {
                    console.error('%c[index.js, moduleDidLoad]', 'color: green;', 'Failed to generate new cert! Returned error was: \n', failedCert);
                }).then(function (ret) {
                    sendMessage('httpInit', [pairingCert.cert, pairingCert.privateKey, myUniqueid]).then(function (ret) {
                        restoreUiAfterNaClLoad();
                    }, function (failedInit) {
                        console.error('%c[index.js, moduleDidLoad]', 'color: green;', 'Failed httpInit! Returned error was: ', failedInit);
                    });
                });
            }
            else {
                sendMessage('httpInit', [pairingCert.cert, pairingCert.privateKey, myUniqueid]).then(function (ret) {
                    restoreUiAfterNaClLoad();
                }, function (failedInit) {
                    console.error('%c[index.js, moduleDidLoad]', 'color: green;', 'Failed httpInit! Returned error was: ', failedInit);
                });
            }

            // load previously connected hosts, which have been killed into an object, and revive them back into a class
            chrome.storage.sync.get('hosts', function(previousValue) {
                hosts = previousValue.hosts != null ? previousValue.hosts : {};
                for(var hostUID in hosts) { // programmatically add each new host.
                    var revivedHost = new NvHTTP(hosts[hostUID].address, myUniqueid, hosts[hostUID].userEnteredAddress);
                    revivedHost.serverUid = hosts[hostUID].serverUid;
                    revivedHost.externalIP = hosts[hostUID].externalIP;
                    revivedHost.hostname = hosts[hostUID].hostname;
                    addHostToGrid(revivedHost);
                }
                console.log('%c[index.js]', 'color: green;', 'Loaded previously connected hosts');
            });
        });
    });
}

// pair to the given NvHTTP host object.  Returns whether pairing was successful.
function pairTo(nvhttpHost, onSuccess, onFailure, randomNumber) {
    if(!pairingCert) {
        snackbarLog('ERROR: cert has not been generated yet. Is NaCl initialized?');
        console.warn('%c[index.js]', 'color: green;', 'User wants to pair, and we still have no cert. Problem = very yes.');
        onFailure();
        return;
    }

    nvhttpHost.pollServer(function (ret) {
        if (!nvhttpHost.online) {
            snackbarLog('Failed to connect to ' + nvhttpHost.hostname + '! Are you sure the host is on?');
            console.error('%c[index.js]', 'color: green;', 'Host declared as offline:', nvhttpHost, nvhttpHost.toString()); //Logging both the object and the toString version for text logs
            onFailure();
            return;
        }

        if (nvhttpHost.paired) {
            onSuccess();
            return;
        }

        // var randomNumber = String("0000" + (Math.random() * 10000 | 0)).slice(-4);
        // var pairingDialog = document.querySelector('#pairingDialog');
        // $('#pairingDialogText').html('Please enter the number ' + randomNumber + ' on the GFE dialog on the computer.  This dialog will be dismissed once complete');
        // pairingDialog.showModal();

        // $('#cancelPairingDialog').off('click');
        // $('#cancelPairingDialog').on('click', function() {
        //     pairingDialog.close();
        // });

        console.log('%c[index.js]', 'color: green;', 'Sending pairing request to ' + nvhttpHost.hostname + ' with random number' + randomNumber);
        nvhttpHost.pair(randomNumber).then(function (paired) {
            if (!paired) {
                if (nvhttpHost.currentGame != 0) {
                    // $('#pairingDialogText').html('Error: ' + nvhttpHost.hostname + ' is busy.  Stop streaming to pair.');
                    snackbarLogLong('Error: ' + nvhttpHost.hostname + ' is busy.  Stop streaming to pair.');
                } else {
                    // $('#pairingDialogText').html('Error: failed to pair with ' + nvhttpHost.hostname + '.');
                    snackbarLogLong('Error: failed to pair with ' + nvhttpHost.hostname + '.');
                }
                console.log('%c[index.js]', 'color: green;', 'Failed API object:', nvhttpHost, nvhttpHost.toString()); //Logging both the object and the toString version for text logs
                onFailure();
                return;
            }

            snackbarLog('Pairing successful');
            // pairingDialog.close();
            onSuccess();
        }, function (failedPairing) {
            snackbarLog('Failed pairing to: ' + nvhttpHost.hostname);
            console.error('%c[index.js]', 'color: green;', 'Pairing failed, and returned:', failedPairing);
            console.error('%c[index.js]', 'color: green;', 'Failed API object:', nvhttpHost, nvhttpHost.toString()); //Logging both the object and the toString version for text logs
            onFailure();
        });
    });
}

//CONNETO: unnecessary function
/*function hostChosen(host) {

    if (!host.online) {
        return;
    }

    // Avoid delay from other polling during pairing
    stopPollingHosts();

    api = host;
    if (!host.paired) {
        // Still not paired; go to the pairing flow
        pairTo(host, function() {
            showApps(host);
            saveHosts();
        },
        function(){
                startPollingHosts();
        });
    } else {
        // When we queried again, it was paired, so show apps.
        showApps(host);
    }
}*/
//CONNETO: unnecessary function


//CONNETO: making new addHost function
/**
 * @param {string} hostIp - ip addresss of the host you want to add
 * @param {string} randomNumber - 4 digit random number used for pairing
 * @callback resolve - executed when 'new' host added successfully
 * @callback reject - executed when failed to add host
 */
function addHost(hostIp, randomNumber, resolve, reject) {
    var _nvhttpHost = new NvHTTP(hostIp, myUniqueid, hostIp);
    pairTo(_nvhttpHost, function() {
        // Check if we already have record of this host
        if (hosts[_nvhttpHost.serverUid] != null) {
            // Just update the addresses
            hosts[_nvhttpHost.serverUid].address = _nvhttpHost.address;
            hosts[_nvhttpHost.serverUid].userEnteredAddress = _nvhttpHost.userEnteredAddress;
        } else {
            beginBackgroundPollingOfHost(_nvhttpHost);
            //addHostToGrid(_nvhttpHost);
            hosts[_nvhttpHost.serverUid] = _nvhttpHost;
            resolve();
        }
        saveHosts();
    }, function() {
        snackbarLog('pairing to ' + hostIp + ' failed!');
        reject();
    }, randomNumber);
}

// the `+` was selected on the host grid.
// give the user a dialog to input connection details for the PC
/*function addHost() {
    var modal = document.querySelector('#addHostDialog');
    modal.showModal();

    // drop the dialog if they cancel
    $('#cancelAddHost').off('click');
    $('#cancelAddHost').on('click', function() {
        modal.close();
    });

    // try to pair if they continue
    $('#continueAddHost').off('click');
    $('#continueAddHost').on('click', function () {
        var inputHost = $('#dialogInputHost').val();
        var _nvhttpHost = new NvHTTP(inputHost, myUniqueid, inputHost);

        pairTo(_nvhttpHost, function() {
            // Check if we already have record of this host
            if (hosts[_nvhttpHost.serverUid] != null) {
                // Just update the addresses
                hosts[_nvhttpHost.serverUid].address = _nvhttpHost.address;
                hosts[_nvhttpHost.serverUid].userEnteredAddress = _nvhttpHost.userEnteredAddress;
            }
            else {
                beginBackgroundPollingOfHost(_nvhttpHost);
                addHostToGrid(_nvhttpHost);
            }
            saveHosts();
        }, function() {
            snackbarLog('pairing to ' + inputHost + ' failed!');
        });
        modal.close();
    });
}*/
//CONNETO: making new addHost function 


// CONNETO: LoginView �����ִ� â ����
function showLoginModal() {
    var modal = document.querySelector('#loginDialog');
    modal.showModal();

    $('#cancelLogin').off('click');
    $('#cancelLogin').on('click', function() {
        modal.close();
    });

    $('#continueLogin').off('click');
    $('#continueLogin').on('click', function() {
        // DataTransmission via TCP Socket
        var hostList = [];
        for (var hostId in hosts) {	//hosts�� ��� host���� ������ ��� �ִ� ������ ���ǵ� ����
            hostList.push({
                "hostId": hostId,		//host�� id(������ ��)
                "hostname": hosts[hostId].hostname,	//host�� �̸�
                "online": hosts[hostId].online,		//host�� ���� online����
                "paired": hosts[hostId].paired,		//host�� ���� pairing�� ��������
                "hostIpaddress": hosts[hostId].address
            });
        }
        chrome.runtime.getBackgroundPage(function (backgroundPage) {
            backgroundPage.sendMsgtoCentralServer({
                
                header: {
                    type: 'Request',
                    token: '',
                    command: 'login',
                    source: 'CONNETO',
                    dest: 'DB'
                },
                body: {
                    userId: $('#userId').val(),
                    userPW: $('#userPassword').val(),
                    hostList
                }
            });
            // modal.close();
        });
    })
}
// CONNETO: LoginView �����ִ� â ����

// host is an NvHTTP object
// CONNETO: unnecessary function
function addHostToGrid(host, ismDNSDiscovered) {

    // var outerDiv = $("<div>", {class: 'host-container mdl-card mdl-shadow--4dp', id: 'host-container-' + host.serverUid, role: 'link', tabindex: 0, 'aria-label': host.hostname });
    // var cell = $("<div>", {class: 'mdl-card__title mdl-card--expand', id: 'hostgrid-' + host.serverUid });
    // $(cell).prepend($("<h2>", {class: "mdl-card__title-text", html: host.hostname}));
    // var removalButton = $("<div>", {class: "remove-host", id: "removeHostButton-" + host.serverUid, role: 'button', tabindex: 0, 'aria-label': 'Remove host ' + host.hostname});
    // removalButton.off('click');
    // removalButton.click(function () {
    //     removeClicked(host);
    // });
    // cell.off('click');
    // cell.click(function () {
    //     hostChosen(host);
    // });
    // outerDiv.keypress(function(e){
    //   if(e.keyCode == 13) {
    //     hostChosen(host);
    //   }
    // });
    // $(outerDiv).append(cell);
    // if (!ismDNSDiscovered) {
    //     // we don't have the option to delete mDNS hosts.  So don't show it to the user.
    //     $(outerDiv).append(removalButton);
    // }
    // $('#host-grid').append(outerDiv);
    hosts[host.serverUid] = host;
}
// CONNETO: unnecessary function


// CONNETO: only part of this function needed, so I made new one
/*function removeClicked(host) {
    var deleteHostDialog = document.querySelector('#deleteHostDialog');
    document.getElementById('deleteHostDialogText').innerHTML =
    ' Are you sure you want to delete ' + host.hostname + '?';
    deleteHostDialog.showModal();

    $('#cancelDeleteHost').off('click');
    $('#cancelDeleteHost').on('click', function () {
        deleteHostDialog.close();
    });

    // locally remove the hostname/ip from the saved `hosts` array.
    // note: this does not make the host forget the pairing to us.
    // this means we can re-add the host, and will still be paired.
    $('#continueDeleteHost').off('click');
    $('#continueDeleteHost').on('click', function () {
        var deleteHostDialog = document.querySelector('#deleteHostDialog');
        $('#host-container-' + host.serverUid).remove();
        delete hosts[host.serverUid]; // remove the host from the array;
        saveHosts();
        deleteHostDialog.close();
    });
}*/

/**
 * @param {NvHTTP} host - object of host you want to remove
 */
function removeHost(host){
    // locally remove the hostname/ip from the saved `hosts` array.
    // note: this does not make the host forget the pairing to us.
    // this means we can re-add the host, and will still be paired.    
    if(host && host.serverUid && hosts[host.serverUid]){
        delete hosts[host.serverUid];
        saveHosts();
    }
}
//CONNETO: only part of this function needed, so I made new one

//CONNETO: unnecessary function
// puts the CSS style for current app on the app that's currently running
// and puts the CSS style for non-current app apps that aren't running
// this requires a hot-off-the-host `api`, and the appId we're going to stylize
// the function was made like this so that we can remove duplicated code, but
// not do N*N stylizations of the box art, or make the code not flow very well
/*function stylizeBoxArt(freshApi, appIdToStylize) {
    if (freshApi.currentGame === appIdToStylize) { // stylize the currently running game
        // destylize it, if it has the not-current-game style
        if ($('#game-'+ appIdToStylize).hasClass("not-current-game")) $('#game-'+ appIdToStylize).removeClass("not-current-game");
        // add the current-game style
        $('#game-'+ appIdToStylize).addClass("current-game");
    } else {
        // destylize it, if it has the current-game style
        if ($('#game-'+ appIdToStylize).hasClass("current-game")) $('#game-'+ appIdToStylize).removeClass("current-game");
        // add the not-current-game style
        $('#game-'+ appIdToStylize).addClass('not-current-game');
    }
}*/
//CONNETO: unnecessary function

function sortTitles(list, sortOrder) {
  return list.sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();

    // A - Z
    if (sortOrder === 'ASC') {
      if (titleA < titleB) { return -1; }
      if (titleA > titleB) { return 1; }
      return 0;
    }

    // Z - A
    if (sortOrder === 'DESC') {
      if (titleA < titleB) { return 1; }
      if (titleA > titleB) { return -1; }
      return 0;    }
  });
}

//CONNETO: unnecesary function
// show the app list
/*function showApps(host) {
    if (!host || !host.paired) { // safety checking. shouldn't happen.
        console.log('Moved into showApps, but `host` did not initialize properly! Failing.');
        return;
    }
    console.log('%c[index.js, showApps]', 'color: green;', 'Current host object:', host, host.toString()); //Logging both object (for console) and toString-ed object (for text logs)
    $('#quitCurrentApp').show();
    $("#gameList .game-container").remove();

    // Show a spinner while the applist loads
    $('#naclSpinnerMessage').text('Loading apps...');
    $('#naclSpinner').css('display', 'inline-block');

    host.getAppList().then(function (appList) {
        // if game grid is populated, empty it
        $("div.game-container").remove();

        $('#naclSpinner').hide();
        $("#game-grid").show();

        const sortedAppList = sortTitles(appList, 'ASC');

        sortedAppList.forEach(function (app) {
            host.getBoxArt(app.id).then(function (resolvedPromise) {
                // put the box art into the image holder
                if ($('#game-' + app.id).length === 0) {
                    // double clicking the button will cause multiple box arts to appear.
                    // to mitigate this we ensure we don't add a duplicate.
                    // This isn't perfect: there's lots of RTTs before the logic prevents anything
                    var outerDiv = $("<div>", {class: 'game-container mdl-card mdl-shadow--4dp', id: 'game-'+app.id, backgroundImage: resolvedPromise, role: 'link', tabindex: 0, title: app.title, 'aria-label': app.title });
                    $(outerDiv).append($("<img \>", {src: resolvedPromise, id: 'game-'+app.id, name: app.title }));
                    $(outerDiv).append($("<div>", {class: "game-title", html: $("<span>", {html: app.title} )}));
                    $("#game-grid").append(outerDiv);

                    $('#game-'+app.id).on('click', function () {
                        startGame(host, app.id);
                    });
                    $('#game-'+app.id).keypress(function(e){
                      if(e.keyCode == 13) {
                        startGame(host, app.id);
                      }
                    });

                    // apply CSS stylization to indicate whether the app is active
                    stylizeBoxArt(host, app.id);
                }

            }, function (failedPromise) {
              console.log('%c[index.js, showApps]', 'color: green;', 'Error! Failed to retrieve box art for app ID: ' + app.id + '. Returned value was: ' + failedPromise, '\n Host object:', host, host.toString());

                if ($('#game-' + app.id).length === 0) {
                    // double clicking the button will cause multiple box arts to appear.
                    // to mitigate this we ensure we don't add a duplicate.
                    // This isn't perfect: there's lots of RTTs before the logic prevents anything
                    var outerDiv = $("<div>", {class: 'game-container mdl-card mdl-shadow--4dp', id: 'game-'+app.id, backgroundImage: "static/res/no_app_image.png" });
                    $(outerDiv).append($("<img \>", {src: "static/res/no_app_image.png", id: 'game-'+app.id, name: app.title }));
                    $(outerDiv).append($("<div>", {class: "game-title", html: $("<span>", {html: app.title} )}));
                    $("#game-grid").append(outerDiv);

                    $('#game-'+app.id).on('click', function () {
                        startGame(host, app.id);
                    });

                    // apply CSS stylization to indicate whether the app is active
                    stylizeBoxArt(host, app.id);
                }
            });
        });
    }, function (failedAppList) {
        $('#naclSpinner').hide();

        console.log('%c[index.js, showApps]', 'color: green;', 'Failed to get applist from host: ' + host.hostname, '\n Host object:', host, host.toString());
    });

    showAppsMode();
}*/
//CONNETO: unnecesary function


//CONNETO: removing the part of calling unnecessary window
// set the layout to the initial mode you see when you open moonlight
function showHostsAndSettingsMode() {
    console.log('entering show hosts and settings mode.');
    //$("#main-navigation").show(); 
    //$(".nav-menu-parent").show();
    //$("#externalAudioBtn").show();
    $("#main-content").children().not("#listener, #loadingSpinner, #naclSpinner").show();
    //$('#game-grid').hide();
    //$('#backIcon').hide();
    //$('#quitCurrentApp').hide();
    $("#main-content").removeClass("fullscreen");
    $("#listener").removeClass("fullscreen");

    startPollingHosts();
}
//CONNETO: removing the part of calling unnecessary window


//CONNETO: Unnecessary function
/*function showAppsMode() {
    console.log("entering show apps mode.");
    $('#backIcon').show();
    $("#main-navigation").show();
    $("#main-content").children().not("#listener, #loadingSpinner, #naclSpinner").show();
    $("#streamSettings").hide();
    $(".nav-menu-parent").hide();
    $("#externalAudioBtn").hide();
    $("#host-grid").hide();
    $("#settings").hide();
    $("#main-content").removeClass("fullscreen");
    $("#listener").removeClass("fullscreen");

    // FIXME: We want to eventually poll on the app screen but we can't now
    // because it slows down box art loading and we don't update the UI live
    // anyway.
    stopPollingHosts();
}*/
//CONNETO: Unnecessary function


// CONNETO: add option argument to automatic setting of resolution, framerate
// start the given appID.  if another app is running, offer to quit it.
// if the given app is already running, just resume it.
function startGame(host, appID, option) {
    // CONNETO: add option argument to automatic setting of resolution, framerate
    if (!host || !host.paired) {
        console.log('attempted to start a game, but `host` did not initialize properly. Failing!');
        return Promise.reject(new Error('attempted to start a game, but `host` did not initialize properly. Failing!'));
    }

    // refresh the server info, because the user might have quit the game.
    return host.refreshServerInfo().then(function(ret) {    //CONNETO: return added
        host.getAppById(appID).then(function(appToStart) {

            if (host.currentGame != 0 && host.currentGame != appID) {
                host.getAppById(host.currentGame).then(function(currentApp) {
                    /*var quitAppDialog = document.querySelector('#quitAppDialog');
                    document.getElementById('quitAppDialogText').innerHTML =
                        currentApp.title + ' is already running. Would you like to quit ' +
                        currentApp.title + '?';
                    quitAppDialog.showModal();
                    $('#cancelQuitApp').off('click');
                    $('#cancelQuitApp').on('click', function () {
                        quitAppDialog.close();
                        console.log('[index.js, startGame]','color: green;', 'Closing app dialog, and returning');
                    });
                    $('#continueQuitApp').off('click');
                    $('#continueQuitApp').on('click', function () {
                        console.log('[index.js, startGame]','color: green;', 'Stopping game, and closing app dialog, and returning');
                        stopGame(host, function () {
                            // please oh please don't infinite loop with recursion
                            startGame(host, appID);
                        });
                        quitAppDialog.close();
                    });*/
                    return;
                }, function (failedCurrentApp) {
                    console.error('[index.js, startGame]','color: green;', 'Failed to get the current running app from host! Returned error was:' + failedCurrentApp, '\n Host object:', host, host.toString());
                    return;
                });
                return;
            }

            // var frameRate = $('#selectFramerate').data('value').toString();
            // var streamWidth = $('#selectResolution').data('value').split(':')[0];
            // var streamHeight = $('#selectResolution').data('value').split(':')[1];
            // var bitrate = parseInt($("#bitrateSlider").val()) * 1000;
            // var remote_audio_enabled = $("#remoteAudioEnabledSwitch").parent().hasClass('is-checked') ? 1 : 0;
            // we told the user it was in Mbps. We're dirty liars and use Kbps behind their back.
            // CONNETO: add option argument to automatic setting of resolution, framerate
            //var frameRate, streamWidth, streamHeight, bitrate, remote_audio_enabled;
            var streamWidth, streamHeight, bitrate, remote_audio_enabled, frameRate, optimize;
            console.log(option);
            if (option) {

                streamWidth = option.streamWidth;
                streamHeight = option.streamHeight;
                bitrate = parseInt(option.bitrate) * 1000;
                remote_audio_enabled = option.remote_audio_enabled;
                frameRate = option.frameRate;
                optimize = option.optimize;
                startOption = option;
            }
            // CONNETO: add option argument to automatic setting of resolution, framerate

            console.log('%c[index.js, startGame]','color:green;', 'startRequest:' + host.address + ":" + streamWidth + ":" + streamHeight + ":" + frameRate + ":" + bitrate + ":" + optimize);

            var rikey = generateRemoteInputKey();
            var rikeyid = generateRemoteInputKeyId();
            var gamepadMask = getConnectedGamepadMask();

            //$('#loadingMessage').text('Starting ' + appToStart.title + '...');
            playGameMode();

            if(host.currentGame == appID) { // if user wants to launch the already-running app, then we resume it.
                return host.resumeApp(
                    rikey, rikeyid, 0x030002 // Surround channel mask << 16 | Surround channel count
                ).then(function (ret) {
                    sendMessage('startRequest', [host.address, streamWidth, streamHeight, frameRate,
                            bitrate.toString(), rikey, rikeyid.toString(), host.appVersion]);
                    api = host;
                }, function (failedResumeApp) {
                    console.eror('%c[index.js, startGame]', 'color:green;', 'Failed to resume the app! Returned error was' + failedResumeApp);
                    return;
                });
            }

            //var remote_audio_enabled = $("#remoteAudioEnabledSwitch").parent().hasClass('is-checked') ? 1 : 0;

            host.launchApp(appID,
                    streamWidth + "x" + streamHeight + "x" + frameRate,
                    optimize, // DON'T Allow GFE (0) to optimize game settings, or ALLOW (1) to optimize game settings
                    rikey, rikeyid,
                    remote_audio_enabled, // Play audio locally too?
                    0x030002, // Surround channel mask << 16 | Surround channel count
                    gamepadMask
                    ).then(function (ret) {
                sendMessage('startRequest', [host.address, streamWidth, streamHeight, frameRate,
                        bitrate.toString(), rikey, rikeyid.toString(), host.appVersion]);
                    api = host;
            }, function (failedLaunchApp) {
                console.error('%c[index.js, launchApp]','color: green;','Failed to launch app width id: ' + appID + '\nReturned error was: ' + failedLaunchApp);
                return;
            });

        });
    });
}

// CONNETO: removing part related to unnecessary ui
function playGameMode() {
    console.log('%c[index.js, playGameMode]', 'color:green;', 'Entering play game mode');
    isInGame = true;

    $("#main-navigation").hide();
    $("#main-content").children().not("#listener, #loadingSpinner").hide();
    $("#main-content").addClass("fullscreen");

    chrome.app.window.current().fullscreen();
    fullscreenNaclModule();
    $('#loadingSpinner').css('display', 'inline-block');

}
// CONNETO: removing part related to unnecessary ui


// Maximize the size of the nacl module by scaling and resizing appropriately
function fullscreenNaclModule() {
    //CONNETO: modifying screen setting
    //var streamWidth = $('#selectResolution').data('value').split(':')[0];
    //var streamHeight = $('#selectResolution').data('value').split(':')[1];
    var streamWidth = startOption.streamWidth;
    var streamHeight = startOption.streamHeight;
    //CONNETO
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    var xRatio = screenWidth / streamWidth;
    var yRatio = screenHeight / streamHeight;

    var zoom = Math.min(xRatio, yRatio);

    var module = $("#nacl_module")[0];
    module.width = zoom * streamWidth;
    module.height = zoom * streamHeight;
    module.style.paddingTop = ((screenHeight - module.height) / 2) + "px";
}

//CONNETO: unnecessary function
/*function stopGameWithConfirmation() {
    if (api.currentGame === 0) {
        snackbarLog('Nothing was running');
    } else {
        api.getAppById(api.currentGame).then(function (currentGame) {
            var quitAppDialog = document.querySelector('#quitAppDialog');
            document.getElementById('quitAppDialogText').innerHTML =
            ' Are you sure you would like to quit ' +
            currentGame.title + '?  Unsaved progress will be lost.';
            quitAppDialog.showModal();
            $('#cancelQuitApp').off('click');
            $('#cancelQuitApp').on('click', function () {
                console.log('%c[index.js, stopGameWithConfirmation]', 'color:green;', 'Closing app dialog, and returning');
                quitAppDialog.close();
            });
            $('#continueQuitApp').off('click');
            $('#continueQuitApp').on('click', function () {
                console.log('%c[index.js, stopGameWithConfirmation]', 'color:green;', 'Stopping game, and closing app dialog, and returning');
                stopGame(api);
                quitAppDialog.close();
            });

        });
    }
}*/
//CONNETO: unnecessary function

//CONNETO: add the process of checking game is running(it's originally in function stopGameWithConfirmation) 
function stopGame(host, callbackFunction) {
    //This part has been added
    if (api.currentGame === 0){
        snackbarLog('Nothing was running');
        return;    
    }
    //////////////////////////
    
    isInGame = false;

    if (!host.paired) {
        return;
    }

    return host.refreshServerInfo().then(function (ret) {
        host.getAppById(host.currentGame).then(function (runningApp) {
            if (!runningApp) {
                snackbarLog('Nothing was running');
                return;
            }
            var appName = runningApp.title;
            snackbarLog('Stopping ' + appName);
            host.quitApp().then(function (ret2) {
                host.refreshServerInfo().then(function (ret3) { // refresh to show no app is currently running.
                    //showAppsMode();
                    //stylizeBoxArt(host, runningApp.id);
                    //if (typeof(callbackFunction) === "function") callbackFunction();
                    return appName;
                }, function (failedRefreshInfo2) {
                    console.error('%c[index.js, stopGame]', 'color:green;', 'Failed to refresh server info! Returned error was:' + failedRefreshInfo + ' and failed server was:', host, host.toString());
                });
            }, function (failedQuitApp) {
                console.error('%c[index.js, stopGame]', 'color:green;', 'Failed to quit app! Returned error was:' + failedQuitApp);
            });
        }, function (failedGetApp) {
          console.error('%c[index.js, stopGame]', 'color:green;', 'Failed to get app ID! Returned error was:' + failedRefreshInfo);
        });
    }, function (failedRefreshInfo) {
        console.error('%c[index.js, stopGame]', 'color:green;', 'Failed to refresh server info! Returned error was:' + failedRefreshInfo);
    });
}

function storeData(key, data, callbackFunction) {
    var obj = {};
    obj[key] = data;
    if(chrome.storage)
        chrome.storage.sync.set(obj, callbackFunction);
}

//CONNETO: modifying functions to my taste
/**
 *  @param {string} chosenResolution - resolution value you want to store {1280:720, 1920:1080, 3840:2160}
 */
function saveResolution(chosenResolution) {
    //var chosenResolution = $(this).data('value');
    //$('#selectResolution').text($(this).text()).data('value', chosenResolution);
    storeData('resolution', chosenResolution, null);
    //updateDefaultBitrate();
}

//CONNETO: change the function to receive args
function saveOptimize(chosenOptimize) {
    // MaterialDesignLight uses the mouseup trigger, so we give it some time to change the class name before
    // checking the new state
    /*setTimeout(function() {
        var chosenOptimize = $("#optimizeGamesSwitch").parent().hasClass('is-checked');
        console.log('%c[index.js, saveOptimize]', 'color: green;', 'Saving optimize state : ' + chosenOptimize);
        storeData('optimize', chosenOptimize, null);
    }, 100);*/
	storeData('optimize', chosenOptimize, null);
}
//CONNETO

function saveFramerate(chosenFrameRate) {
    //var chosenFramerate = $(this).data('value');
    //$('#selectFramerate').text($(this).text()).data('value', chosenFramerate);
    storeData('frameRate', chosenFramerate, null);
    //updateDefaultBitrate();
}
//CONNETO: modifying functions to my taste

// storing data in chrome.storage takes the data as an object, and shoves it into JSON to store
// unfortunately, objects with function instances (classes) are stripped of their function instances when converted to a raw object
// so we cannot forget to revive the object after we load it.
function saveHosts() {
    storeData('hosts', hosts, null);
}

/**
 * @param {string} bitrate - bitrate value you want to store {0 - 100} 
 */
function saveBitrate(bitrate) {
    //CONNETO: modifying option saving function 
    //storeData('bitrate', $('#bitrateSlider').val(), null);
    storeData('bitrate', bitrate, null);
    //CONNETO: modifying option saving function
}

/**
 * @param {boolean} remoteAudioState - state of the remote audio you want to store {true, false}
 */
function saveRemoteAudio(remoteAudioState) {
    // MaterialDesignLight uses the mouseup trigger, so we give it some time to change the class name before
    // checking the new state
    /*setTimeout(function() {
        var remoteAudioState = $("#remoteAudioEnabledSwitch").parent().hasClass('is-checked');
        console.log('saving remote audio state : ' + remoteAudioState);
        storeData('remoteAudio', remoteAudioState, null);
        console.log(typeof(remoteAudioState) + remoteAudioState);
    }, 100);*/

    //CONNETO: modifying option saving function
    storeData('remoteAudio', remoteAudioState, null);
    //CONNETO: modifying option saving function
}

//CONNETO: removing unnecessaries
/*function updateDefaultBitrate() {
    var res = $('#selectResolution').data('value');
    var frameRate = $('#selectFramerate').data('value').toString();

    if (res ==="1920:1080") {
        if (frameRate === "30") { // 1080p, 30fps
            $('#bitrateSlider')[0].MaterialSlider.change('10');
        } else { // 1080p, 60fps
            $('#bitrateSlider')[0].MaterialSlider.change('20');
        }
    } else if (res === "1280:720") {
        if (frameRate === "30") { // 720, 30fps
            $('#bitrateSlider')[0].MaterialSlider.change('5');
        } else { // 720, 60fps
            $('#bitrateSlider')[0].MaterialSlider.change('10');
        }
    } else if (res === "3840:2160") {
        if (frameRate === "30") { // 2160p, 30fps
            $('#bitrateSlider')[0].MaterialSlider.change('40');
        } else { // 2160p, 60fps
            $('#bitrateSlider')[0].MaterialSlider.change('80');
        }
    } else {  // unrecognized option. In case someone screws with the JS to add custom resolutions
        $('#bitrateSlider')[0].MaterialSlider.change('10');
    }

    updateBitrateField();
    saveBitrate();
}*/
//CONNETO: removing unnecessaries

//CONNETO: removing unnecessaries
function onWindowLoad() {
    console.log('Window loaded.' );
    // don't show the game selection div
    $('#gameSelection').css('display', 'none');
    
    loadWindowState();
    
    //CONNETO: removing unnecessaries
    /*if(chrome.storage) {
        // load stored resolution prefs
        chrome.storage.sync.get('resolution', function(previousValue) {
            if(previousValue.resolution != null) {
                $('.resolutionMenu li').each(function () {
                    if ($(this).data('value') === previousValue.resolution) {
                        $('#selectResolution').text($(this).text()).data('value', previousValue.resolution);
                    }
                });
            }
        });

        // Load stored remote audio prefs
        chrome.storage.sync.get('remoteAudio', function(previousValue) {
            if(previousValue.remoteAudio == null) {
                document.querySelector('#externalAudioBtn').MaterialIconToggle.uncheck();
            } else if (previousValue.remoteAudio == false) {
                document.querySelector('#externalAudioBtn').MaterialIconToggle.uncheck();
            }  else {
                document.querySelector('#externalAudioBtn').MaterialIconToggle.check();
            }
        });

        // load stored framerate prefs
        chrome.storage.sync.get('frameRate', function(previousValue) {
            if(previousValue.frameRate != null) {
                $('.framerateMenu li').each(function () {
                    if ($(this).data('value') === previousValue.frameRate) {
                        $('#selectFramerate').text($(this).text()).data('value', previousValue.frameRate);
                    }
                });
            }
        });

        // load stored optimization prefs
        chrome.storage.sync.get('optimize', function(previousValue) {
            if (previousValue.optimize == null) {
                document.querySelector('#optimizeGamesBtn').MaterialIconToggle.check();
            } else if (previousValue.optimize == false) {
                document.querySelector('#optimizeGamesBtn').MaterialIconToggle.uncheck();
            }  else {
                document.querySelector('#optimizeGamesBtn').MaterialIconToggle.check();
            }
        });

        // load stored bitrate prefs
        chrome.storage.sync.get('bitrate', function(previousValue) {
            $('#bitrateSlider')[0].MaterialSlider.change(previousValue.bitrate != null ? previousValue.bitrate : '10');
            updateBitrateField();
        });
	
    }*/
}


window.onload = onWindowLoad;
