///////////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js,pref.js,decode.js
///////////////////////////////////////////////////////////////////
window.addEventListener("load", function(){
    document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', xThunderMain.OnContextMenu, false);
    xThunderMain.setIconVisible(xThunderPref.getValue("showStatusIcon"));
    xThunderMain.addClickSupport();
}, false);

var xThunderMain = {
    clickVntAdded : false,

    setIconVisible : function(visible) {
        document.getElementById('xThunderStatusBtn').setAttribute('hidden', !visible);
    },

    addClickSupport : function() {
        if (xThunderPref.getValue("supportClick") != "" ||
            xThunderPref.getValue("supportExt") != "" && xThunderPref.getValue("remember")) {

            var win = window.gBrowser || window;
            if (xThunderMain.clickVntAdded)
                return;
            win.addEventListener("click", function(ev) {
                if (ev.button != 0 || ev.shiftKey || ev.altKey) {
                    return true;
                }

                var remExt = xThunderPref.getValue("remember");

                var link = ev.target;
                if (typeof link.href == "undefined" && !xThunderDecode.downReg.test(link.name)) {
                    link = link.parentNode;
                    if (!link || typeof link.href == "undefined") {
                        return true;
                    }
                }

                var url = link.href || link.name;
                var download = false;

                //Ctrl + Click
                if (ev.ctrlKey && xThunderPref.getValue("ctrlNoMonitor"))
                {
                    //remember value is 0:never down, 1: auto down, -1: no down this time
                    if (remExt == 1) {
                        xThunderPref.setValue('remember', -1);
                    }

                    //udown link is got asynchronously, so decodedUrl may be null
                    if(!xThunderDecode.udownReg.test(url.replace(/ /g, ''))) {
                        var decodedUrl = xThunderDecode.getDecodedNode(link);
                        if (decodedUrl && decodedUrl != url) {
                            //Open decoded link by Firefox
                            document.commandDispatcher.focusedWindow.location.href = decodedUrl;
                            ev.preventDefault();
                            ev.stopPropagation();
                            return false;
                        }
                    }

                    //Open in backgrond tab - Firefox default way
                    return true;
                } else {
                    if (remExt == -1) {
                        xThunderPref.setValue('remember', 1);
                    }
                }

                //click support for associated file
                var supExt = xThunderPref.getValue("supportExt");
                if (remExt && supExt != "") {
                    var subUrls = url.split("?");
                    var matches = subUrls[0].match(/^(?:ftp|https?):\/\/.*(\.\w+)/i);
                    if (matches) {
                        if (supExt.indexOf(matches[1] + ";") != -1) {
                            url = xThunderDecode.getDecodedUrl(url);
                            download = true;
                        } else if (matches[1].indexOf("htm") == -1 && subUrls.length > 1){
                            var subParams = subUrls[1].split("&");
                            for (var j=0; j<subParams.length; ++j) {
                                matches = subParams[j].match(/.*(\.\w+)/i);
                                if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                                    url = xThunderDecode.getDecodedUrl(url);
                                    download = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                //click support for protocals
                var supstr = xThunderPref.getValue("supportClick");
                if (!download && supstr != "") {
                    var protocals = supstr.split(",");
                    var contextmenu;
                    for (var i=0; i<protocals.length-1; ++i) {
                        if (protocals[i] == "thunder" &&
                                (url.indexOf("thunder:") == 0 ||
                                link.getAttribute("thunderhref") ||
                                (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("ThunderNetwork_SetHref") != -1)
                         || protocals[i] == "flashget" &&
                                (url.indexOf("flashget:") == 0 ||
                                link.getAttribute("fg") ||
                                (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("Flashget_SetHref") != -1)
                         || protocals[i] == "qqdl" &&
                                (url.indexOf("qqdl:") == 0 ||
                                link.getAttribute("qhref"))
                         || protocals[i] == "ed2k" && 
                                (url.indexOf("ed2k:") == 0 ||
                                link.getAttribute("ed2k"))
                         || protocals[i] == "magnet" && url.indexOf("magnet:") == 0
                         || protocals[i] == "fs2you" && url.indexOf("fs2you:") == 0
                         || protocals[i] == "115" && url.indexOf("http://u.115.com/file/") == 0
                         || protocals[i] == "udown" &&
                                link.id == "udown" && (contextmenu = link.getAttribute("onclick")) && contextmenu.indexOf("AddDownTask") != -1
                        ) {
                            url = xThunderDecode.getDecodedNode(link);
                            download = true;
                            break;
                        }
                    }
                }

                //download url by thunder
                if (download) {
                    xThunder.callThunder(url, link.ownerDocument.URL);
                    ev.preventDefault();
                    ev.stopPropagation();
                    return false;
                } else {
                    return true;
                }
            }, true);   // end gBrowser click event

            xThunderMain.clickVntAdded = true;
        }
    },

    OnContextMenu : function(event) {
        if (event.target != document.getElementById('contentAreaContextMenu')) 
            return;
        
        var downloadMenu = document.getElementById("xThunderDownload");
        var downloadLinkItem = document.getElementById("xThunderDownloadLink");
        var downloadAllItem = document.getElementById("xThunderDownloadAll");
        var sepItem = document.getElementById("xThunderDownloadUp");
        var downHidden = !xThunderPref.getValue("downInCxtMenu");
        var downAllHidden = !xThunderPref.getValue("downAllInCxtMenu");
        var downSubMenuShown = xThunderPref.getValue("downSubMenu");

        if (!downHidden) {
            //Show download link in context menu if needed
            if (gContextMenu.onLink) {
                var link = gContextMenu.target;
                downHidden = (/^(javascript|data):/i.test(gContextMenu.linkURL))
                    && !(link.id == "udown" && (link = link.getAttribute("onclick")) && link.indexOf("AddDownTask") != -1);
            } else if (gContextMenu.onImage) {
                downHidden = false;
            } else {
                var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
                downHidden = !xThunderDecode.downReg.test(selText);
            }
        }

        var showMenuIcons = xThunderPref.getValue("showMenuIcons");
        var showAllHotKey = xThunderPref.getValue("downAllHotKey");
        downloadMenu.className = showMenuIcons ? "menu-iconic" : "";
        downloadLinkItem.className = downloadAllItem.className = showMenuIcons ? "menuitem-iconic" : "";
        downloadLinkItem.setAttribute("hidden", downHidden || downSubMenuShown);
        downloadMenu.setAttribute("hidden", downHidden || !downSubMenuShown);
        //Fix Bug 630830 before Firefox5 - "key" attribute changes to menuitems are not handled
        downloadAllItem.setAttribute("acceltext", showAllHotKey ? "Alt+F1" : "");
        downloadAllItem.setAttribute("key", showAllHotKey ? "xThunderAllKey" : "");
        downloadAllItem.setAttribute("hidden", downAllHidden);
        sepItem.setAttribute("hidden", downHidden && downAllHidden);
    },

    OnThunderDownload : function(agentName, ctxMenu) {
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;
        xThunder.init(htmlDocument.URL, 1, agentName);

        if (gContextMenu.onLink) {
            // Get current link URL
            url = xThunderDecode.getDecodedNode(gContextMenu.target);
        }
        else if (gContextMenu.onImage) {
            // Get current image url
            url = gContextMenu.target.src;
        } else {
            // Get selected url
            url = document.commandDispatcher.focusedWindow.getSelection().toString();
            url = xThunderDecode.getDecodedUrl(url);
        }

        xThunder.addTask(url);
        if (ctxMenu)
            ctxMenu.hidePopup();
        xThunder.callAgent();
    },

    OnThunderDownloadAll : function(event) {
        // Get current page URL
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;

        // Get all links and all image count
        var links = htmlDocument.links;
        var linkCount = links.length;
        var images = null;
        var imageCount = 0;
        if (xThunderPref.getValue("includeImages")) {
            images = htmlDocument.images;
            imageCount = images.length;
        }

        if (xThunderPref.getValue("agentName") == "ToolbarThunder" && linkCount+imageCount > 1) {
            alert('MiniThunder does not support batch downloading!');
            return false;
        }

        xThunder.init(htmlDocument.URL, linkCount+imageCount);

        for (var i=0; i<linkCount; ++i) {
            url = xThunderDecode.getDecodedNode(links[i]);
            if (xThunderDecode.udownReg.test(links[i].href.replace(/ /g, ''))) {
                //udown link is got asynchronously, so do not use wrong textContent
                xThunder.addTask(url);
            } else {
                xThunder.addTask(url, links[i].textContent);
            }
        }

        for (var j=0; j<imageCount; ++j) {
            url = images[j].src;
            xThunder.addTask(url, images[j].getAttribute("alt") || images[j].title);
        }

        xThunder.callAgent();
    },

    OnThunderDownloadPopup : function(target) {
        xThunderPref.appendAgentList(target, 'xThunderBy', 'xThunderMain.OnThunderDownload', true);
        //set nonsupport agents item's className to agentNonsup
        var url;
        if (gContextMenu.onLink)
            url = gContextMenu.target.getAttribute('fg') || gContextMenu.linkURL;
        else if (gContextMenu.onImage)
            url = gContextMenu.target.src;
        else
            url = document.commandDispatcher.focusedWindow.getSelection().toString();

        url = xThunderDecode.getPreDecodedUrl(url);
        var agentsNonsup = xThunderPref.getAgentsNonsupURL(url);
        for (var i=0; i<agentsNonsup.length; ++i) {
            document.getElementById("xThunderBy" + agentsNonsup[i]).className = "agentNonsup";
        }
    },

    OnThunderOptsPopup : function(target) {
        xThunderPref.appendAgentList(target, 'xThunderOptsAgent', 'xThunderMain.OnChangeAgent', true);
        document.getElementById("xThunderOptsUdown" + xThunderPref.getValue("udown")).setAttribute("checked", true);
        document.getElementById("xThunderOptsIncludeImages").setAttribute("checked", xThunderPref.getValue("includeImages"));
    },

    OnChangeAgent : function(newAgentName) {
        xThunderPref.setValue("agentName", newAgentName);
    },

    OnChangeUdown : function(udownIndex) {
        xThunderPref.setValue("udown", udownIndex);
    },

    OnToogleIncludeImages : function() {
        xThunderPref.setValue("includeImages", !xThunderPref.getValue("includeImages"));
    },

    OnOpenOptionsDlg : function() {
        window.openDialog('chrome://xthunder/content/options.xul', 'xthunderOptions', 'chrome,modal=yes,resizable=no').focus();
    }
};