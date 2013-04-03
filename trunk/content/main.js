///////////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js,pref.js,decode.js
///////////////////////////////////////////////////////////////////
window.addEventListener("load", function(){
    xThunderMain.setIconVisible(xThunderPref.getValue("showStatusIcon"));
    xThunderMain.addContextMenuListener();
    xThunderMain.addClickSupport();
}, false);

window.addEventListener("unload", function(){
    xThunderMain.deleteTempFiles();
}, false);

var xThunderMain = {
    ctxMenu : null,
    clickVntAdded : false,
    
    deleteTempFiles : function() {
       try {
           var file = Components.classes["@mozilla.org/file/directory_service;1"].
               getService(Components.interfaces.nsIProperties).
               get("TmpD", Ci.nsIFile);
           file.append("xThunder");
           if (file.exists())
               file.remove(true);
       } catch(ex) {}
    },

    setIconVisible : function(visible) {
        document.getElementById("xThunderStatusBtn").setAttribute("hidden", !visible);
    },

    addClickSupport : function() {
        if (xThunderPref.getValue("supportClick") != "" ||
            xThunderPref.getValue("supportExt") != "" && xThunderPref.getValue("remember")) {

            if (!xThunderMain.clickVntAdded) {
                var win = window.gBrowser || window;
                win.addEventListener("click", function(ev) {
                    if (ev.button != 0 || ev.shiftKey) {
                        return true;
                    }
                    return xThunderMain.OnLeftClick(ev);
                }, true);

                xThunderMain.clickVntAdded = true;
            }
        }
    },

    addContextMenuListener : function() {
        this.ctxMenu = document.getElementById("contentAreaContextMenu");
        this.ctxMenu.addEventListener("popupshowing", function(event){
            if (event.target == this) {
                xThunderMain.OnContextMenu();
            }
        }, false);
    },
    
    OnLeftClick : function(ev) {
        var remExt = xThunderPref.getValue("remember");

        var link = ev.target;
        if (typeof link.href == "undefined"  && !link.getAttribute("href") && !xThunderPref.proSupReg.test(link.name)) {
            link = link.parentNode;
            if (!link || typeof link.href == "undefined") {
                return true;
            }
        }

        var url = link.href || link.getAttribute("href") || link.name;
        var download = false;

        // Ctrl + Click and Ctrl + Alt + Click
        if (ev.ctrlKey) {            
            try {
                var decodedUrl;
                if (ev.altKey) {
                    if (xThunderPref.getValue("ctrlAltDecode")) {
                        // Copy decode url to clipboard 
                        decodedUrl = xThunderDecode.getDecodedNode(link);
                        link.setAttribute("href", decodedUrl);
                        var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                            getService(Components.interfaces.nsIClipboardHelper);
                        gClipboardHelper.copyString(decodedUrl);
                    } else {
                        // Do Firefox default behavior
                        return true;
                    }
                } else {
                    if (remExt == 1) {
                        // 0:never down, 1: auto down, -1: no down this time
                        xThunderPref.setValue("remember", -1); 
                    }
                        
                    if (xThunderPref.getValue("ctrlNoMonitor") && (decodedUrl = xThunderDecode.getDecodedNode(link)) && decodedUrl != url) {
                        // Open decoded link in current tab
                        document.commandDispatcher.focusedWindow.location.href = decodedUrl;
                    } else {
                        // Open in backgrond new tab - Firefox default behavior
                        return true;
                    }
                }
            } catch(ex) {} 
            
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        } else {
            if (remExt == -1) {
                xThunderPref.setValue("remember", 1);
            }
        }

        // Click support for associated file
        if (remExt) {
            download = xThunderPref.isExtSupURL(url);
        }

        // Click support for protocols
        if (!download) {
            var supstr = xThunderPref.getValue("supportClick");
            download = supstr != "" && xThunderDecode.isProSupNode(link, url, supstr.split(","));
            if(download) {
                url = xThunderDecode.getDecodedNode(link);
            }
        } 

        // Async decode will return false when callAgent
        // Currently there are no async decoding method though
        if (download && xThunder.apiDownUrl(link.ownerDocument.URL, url)) {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        } else {
            return true;
        }
    },

    OnContextMenu : function() {
        var downloadMenu = document.getElementById("xThunderDownload");
        var downloadLinkItem = document.getElementById("xThunderDownloadLink");
        var downloadOffLineItem = document.getElementById("xThunderDownloadOffLine");
        var downloadAllItem = document.getElementById("xThunderDownloadAll");
        var sepItem = document.getElementById("xThunderDownloadUp");
        var downCompactMenu = document.getElementById("xThunderCompact");
        var downCompactPopup = document.getElementById("xThunderCompactPopup");
        var downHidden = !xThunderPref.getValue("downInCxtMenu");
        var downOffLineHidden = !xThunderPref.getValue("downOffLineInCxtMenu");
        var downAllHidden = !xThunderPref.getValue("downAllInCxtMenu");
        var downSubMenuShown = xThunderPref.getValue("downSubMenu");
        var compact = xThunderPref.getValue("compactMenu");

        if (!downHidden) {
            // Show xThunder link in context menu if needed
            if (gContextMenu.onLink || gContextMenu.onImage) {
                downHidden = false;
            } else {
                var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
                downHidden = !xThunderPref.isSupURL(selText);
            }
        }
        if (!downOffLineHidden) {
            // Show xThunder offLine anyway or if needed
            downOffLineHidden = !xThunderPref.getValue("downOffLineAnyway") && downHidden;
        }

        var showMenuIcons = xThunderPref.getValue("showMenuIcons");
        var items = [downloadLinkItem, downloadOffLineItem, downloadAllItem];
        var itemHiddens = [downHidden, downOffLineHidden, downAllHidden];
        var itemVisibleCount = 0;
        for (var i=0; i<items.length; i++) {
            // Compact all items to sub menu
            if (downCompactPopup.childNodes.length < items.length) {
                var cloneSubItem = items[i].cloneNode(true);
                cloneSubItem.id += "Sub";
                downCompactPopup.appendChild(cloneSubItem);
            }
            downCompactPopup.childNodes[i].hidden = itemHiddens[i];
            itemVisibleCount += (itemHiddens[i] ? 0 : 1);
            items[i].className = showMenuIcons ? "menuitem-iconic" : "";
            items[i].hidden = compact || itemHiddens[i];
        }
        downCompactMenu.className = downloadMenu.className = showMenuIcons ? "menu-iconic" : "";
        downCompactMenu.hidden = !compact || (itemVisibleCount == 0); 
        downloadMenu.hidden = compact || (downHidden || !downSubMenuShown);
        downloadLinkItem.hidden = compact || (downHidden || downSubMenuShown);
        sepItem.hidden = (itemVisibleCount == 0);
    },
    
    // Firefox may not close context menu and trigger wrong item
    // e.g. Inspect element of Firebug
    _closeCtxMenu : function(event) {
        this.ctxMenu.hidePopup();
        if (event && event.button == 2) {
            event.preventDefault();
            event.stopPropagation();
        }
    },

    _delayCallAgent : function(event) {
        this._closeCtxMenu(event);
        window.setTimeout(function() {xThunder.callAgent();}, xThunderPref.getValue("delayMilliSec"));
    },

    _getUrlsFromClipboard : function() {
        var pasteText = "";
        try {
            var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            if ('init' in trans) {
                trans.init(null);
            }
            var str       = {};
            var strLength = {};
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);
            trans.getTransferData("text/unicode", str, strLength);
            if (str) {
                pasteText = str.value.QueryInterface(Components.interfaces.nsISupportsString).data;
            }
        } catch (ex) {}
        
        return pasteText.split("\n");
    },

    OnThunderDownload : function(event, agentName, offLine) {
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;
        var agent = agentName || xThunderPref.getAgentByClick(event, xThunderPref.getValue("downOffLineSubMenu"));
        xThunder.init(htmlDocument.URL, 1, agent, offLine);
        
        if (gContextMenu.onLink) {
            // Get current link URL
            var linkNode = gContextMenu.target;
            if (typeof linkNode.href == "undefined" ) {
                linkNode = linkNode.parentNode;
            }
            url = xThunderDecode.getDecodedNode(linkNode);
        }
        else if (gContextMenu.onImage) {
            // Get current image url
            url = gContextMenu.target.src;
        } else {
            // Get selected url
            url = document.commandDispatcher.focusedWindow.getSelection().toString();
            if (!url || !xThunderPref.isSupURL(url)) {
                url = this._getUrlsFromClipboard()[0];
            }
            if (!url || !xThunderPref.isSupURL(url)) {
                url = "http://";
            }
            url = xThunderDecode.getDecodedUrl(url);
        }

        xThunder.addTask(url);
        this._delayCallAgent(event);
    },

    OnThunderDownloadBy : function(agentName) {
        this.OnThunderDownload(null, agentName);
    },

    OnThunderDownloadOffLine : function(event) {
        var agent = "ThunderOffLine";
        if (event) {
            if (event.button == 1) {
                // Middle click to use thunder vod offline
                agent = "ThunderVODOffLine";
            } else {
                // Left click to use first agent offline
                // Right click to use second agent offline
                var agentList = xThunderPref.getEnabledAgentList(true);
                var firstAgent = "ThunderOffLine";
                var secondAgent = "QQDownloadOffLine";
                var thunderIndex = agentList.indexOf(firstAgent);
                if (thunderIndex == -1) {
                    thunderIndex = agentList.length;
                }
                var qqdownloadIndex = agentList.indexOf(secondAgent);
                if (qqdownloadIndex == -1) {
                    qqdownloadIndex = agentList.length + 1;
                }
                // Swap agent if user set QQDownload before Thunder
                if (thunderIndex > qqdownloadIndex) {
                    var temp = firstAgent;
                    firstAgent = secondAgent;
                    secondAgent = temp;
                }
                agent = (event.button == 0 ? firstAgent : secondAgent);
            }
        }

        this.OnThunderDownload(null, agent, true);
    },

    OnThunderDownloadAll : function(event) {
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;

        // Get all links and all image count
        var links = htmlDocument.links;
        var linkCount = links ? links.length : 0;
        var images = null;
        var imageCount = 0;
        if (xThunderPref.getValue("includeImages")) {
            images = htmlDocument.images;
            imageCount = images ? images.length : 0;
        }

        var taskCount = linkCount + imageCount;
        var agent = xThunderPref.getAgentByClick(event, false);
        if (taskCount == 0) {
            // Download all urls from clipboard if there are no links in page 
            var urlTexts = this._getUrlsFromClipboard();
            var urls = [];
            for (var line in urlTexts) {
                if (xThunderPref.isSupURL(urlTexts[line])) {
                    urls.push(xThunderDecode.getDecodedUrl(urlTexts[line]));
                }
            }
            if (urls.length > 0) {
                xThunder.apiDownUrl(htmlDocument.URL, urls, agent);
            }
            return true;
        }
        
        if (taskCount > 1 && (agent == "ToolbarThunder" || agent == "FlashGetMini")) {
            this._closeCtxMenu(event);
            alert(agent + " does not support batch downloading!");
            return false;
        }

        xThunder.init(htmlDocument.URL, taskCount, agent);

        for (var i=0; i<linkCount; ++i) {
            url = xThunderDecode.getDecodedNode(links[i]);
            xThunder.addTask(url, links[i].textContent);
        }

        for (var j=0; j<imageCount; ++j) {
            url = images[j].src;
            xThunder.addTask(url, images[j].getAttribute("alt") || images[j].title);
        }

        this._delayCallAgent(event);
        return true;
    },

    OnThunderDownloadPopup : function(target) {
        xThunderPref.appendAgentList(target, "xThunderBy", "xThunderMain.OnThunderDownloadBy", true, xThunderPref.getValue("downOffLineSubMenu"));
        // Set className of nonsupport agents item to agentNonsup
        var url;
        if (gContextMenu.onLink) {
            var linkNode = gContextMenu.target;
            if (typeof linkNode.href == "undefined" ) {
                linkNode = linkNode.parentNode;
            }
            url = linkNode.getAttribute("fg") || linkNode.getAttribute("qhref") || gContextMenu.linkURL;
        } else if (gContextMenu.onImage) {
            url = gContextMenu.target.src;
        } else {
            url = document.commandDispatcher.focusedWindow.getSelection().toString();
        }
        url = xThunderDecode.getPreDecodedUrl(url);
        var agentsNonsup = xThunderPref.getUnsupAgents(url);
        for (var i=0; i<agentsNonsup.length; ++i) {
            var subItem = document.getElementById("xThunderBy" + agentsNonsup[i]);
            if (subItem)
                subItem.className = "agentNonsup";
        }
    },

    OnThunderOptsPopup : function() {
        xThunderPref.appendAgentList(document.getElementById("xThunderOptsDefAgentPopup"), "xThunderOptsAgent", "xThunderMain.OnChangeAgent", true);
        document.getElementById("xThunderOptsFilterExt").setAttribute("checked", xThunderPref.getValue("filterExt"));
        document.getElementById("xThunderOptsIncludeImages").setAttribute("checked", xThunderPref.getValue("includeImages"));
    },

    OnChangeAgent : function(newAgentName) {
        xThunderPref.setDefaultAgent(newAgentName);
    },

    OnToogleFilterExt : function() {
        xThunderPref.setValue("filterExt", !xThunderPref.getValue("filterExt"));
    },

    OnToogleIncludeImages : function() {
        xThunderPref.setValue("includeImages", !xThunderPref.getValue("includeImages"));
    },

    OnOpenOptionsDlg : function() {
        window.openDialog("chrome://xthunder/content/options.xul", "xthunderOptions", "chrome,modal=yes,resizable=no").focus();
    }
};