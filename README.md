#Moonlight for Chrome

[Moonlight for Chrome](http://moonlight-stream.com) is an open source implementation of NVIDIA's GameStream, as used by the NVIDIA Shield, but built to run in the Chrome browser.

Moonlight for Chrome allows you to stream your full collection of games from your powerful desktop to another PC or laptop running Windows, Mac OS X, Linux, or Chrome OS.

Moonlight also has mobile versions for [Android](https://github.com/moonlight-stream/moonlight-android) and  [iOS](https://github.com/moonlight-stream/moonlight-ios).

**This client is not yet complete, so you will probably not find much use for it unless you're a developer wishing to tinker with it**

##Features

* Streams Steam Big Picture and all of your games from your PC to your Chrome browser
* Keyboard and mouse support
* Hardware-accelerated video decoding
* Full support for Xbox controllers and PlayStation controllers, and some other HID gamepads


##Features to come
* Use mDNS to scan for compatible GeForce Experience (GFE) machines on the network
* Choose from your list of available games instead of just launching Steam

##Installation
* Download [GeForce Experience](http://www.geforce.com/geforce-experience) and install on your GameStream-compatible PC
* Install Moonlight for Chrome from the Chrome Web Store

##Requirements
* Chrome browser on Windows, Mac OS X, Linux, or Chrome OS
* [GFE compatible](http://shield.nvidia.com/play-pc-games/) computer with GTX 600+ series desktop or mobile GPU (for the PC from which you're streaming)
* High-end wireless router (802.11n dual-band recommended) or wired network

##Building
1. Install the Chrome Native Client SDK and download the current Pepper SDK
2. Set the NACL_SDK_ROOT environment variable to your Pepper SDK folder
3. Run 'make' from within the moonlight-chrome repo

##Testing
1. Open the Extensions page in Chrome
2. Check the 'Developer mode' option
3. Click 'Load unpacked extension' and point it at your built moonlight-chrome repo
4. Run Moonlight from the extensions page
5. If making changes, make sure to click the Reload button on the Extensions page

##Contribute

This project is being actively developed at [XDA Developers](http://forum.xda-developers.com/showthread.php?t=2505510)

1. Fork us
2. Write code
3. Send Pull Requests

Check out our [website](http://moonlight-stream.com) for project links and information.