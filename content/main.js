///////////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js,pref.js,decode.js
///////////////////////////////////////////////////////////////////
window.addEventListener("load", function(){
    xThunderMain.setIconVisible(xThunderPref.getValue("showStatusIcon"));
    xThunderMain.addContextMenuListener();
    xThunderMain.addClickSupport();
}, false);

var xThunderMain = {
    ctxMenu : null,
    clickVntAdded : false,

    setIconVisible : function(visible) {
        document.getElementById("xThunderStatusBtn").setAttribute("hidden", !visible);
    },

    addClickSupport : function() {
        if (xThunderPref.getValue("supportClick") != "" ||
            xThunderPref.getValue("supportExt") != "" && xThunderPref.getValue("remember")) {

            var win = window.gBrowser || window;
            if (xThunderMain.clickVntAdded)
                return;
            win.addEventListener("click", function(ev) {
                if (ev.button != 0 || ev.shiftKey) {
                    return true;
                }
                return xThunderMain.OnLeftClick(ev);
            }, true);

            xThunderMain.clickVntAdded = true;
        }
    },

    addContextMenuListener : function() {
        this.ctxMenu = document.getElementById("contentAreaContextMenu");
        this.ctxMenu.addEventListener("popupshowing", function(event){
            if (event.target == this)
                xThunderMain.OnContextMenu();
        }, false);
    },
    
    OnLeftClick : function(ev) {
        var remExt = xThunderPref.getValue("remember");

        var link = ev.target;
        if (typeof link.href == "undefined" && !xThunderPref.proSupReg.test(link.name)) {
            link = link.parentNode;
            if (!link || typeof link.href == "undefined") {
                return true;
            }
        }

        var url = link.href || link.name;
        var download = false;

        //Ctrl + Click and Ctrl + Alt + Click
        if (ev.ctrlKey) {
            //udown link is got asynchronously, so decodedUrl may be null
            if(xThunderDecode.udownReg.test(url)) {
                return true;
            }
            
            try {
                var decodedUrl = xThunderDecode.getDecodedNode(link);
                if (ev.altKey && xThunderPref.getValue("ctrlAltDecode")) {
                    //Copy decode url to clipboard 
                    link.setAttribute("href", decodedUrl);
                    var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                        .getService(Components.interfaces.nsIClipboardHelper);
                    gClipboardHelper.copyString(decodedUrl);
                } else {
                    if (remExt == 1) {
                        //0:never down, 1: auto down, -1: no down this time
                        xThunderPref.setValue("remember", -1);
                    }
                    
                    if (xThunderPref.getValue("ctrlNoMonitor") && decodedUrl && decodedUrl != url) {
                        //Open decoded link in current tab
                        document.commandDispatcher.focusedWindow.location.href = decodedUrl;
                    } else {
                        //Open in backgrond new tab - Firefox default behavior
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

        //click support for associated file
        if (remExt) {
            download = xThunderPref.isExtSupURL(url);
        }

        //click support for protocals
        var supstr = xThunderPref.getValue("supportClick");
        if (!download && supstr != "") {
            download = xThunderDecode.isProSupNode(link, url, supstr.split(","));
            if(download) {
                url = xThunderDecode.getDecodedNode(link);
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
    },

    OnContextMenu : function() {
        var downloadMenu = document.getElementById("xThunderDownload");
        var downloadLinkItem = document.getElementById("xThunderDownloadLink");
        var downloadOffLineItem = document.getElementById("xThunderDownloadOffLine");
        var downloadAllItem = document.getElementById("xThunderDownloadAll");
        var sepItem = document.getElementById("xThunderDownloadUp");
        var downHidden = !xThunderPref.getValue("downInCxtMenu");
        var downOffLineHidden = !xThunderPref.getValue("downOffLineInCxtMenu");
        var downAllHidden = !xThunderPref.getValue("downAllInCxtMenu");
        var downSubMenuShown = xThunderPref.getValue("downSubMenu");

        if (!downHidden) {
            //Show xThunder link in context menu if needed
            if (gContextMenu.onLink || gContextMenu.onImage) {
                downHidden = false;
            } else {
                var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
                selText = selText.replace(/^\s+/g, "");
                downHidden = !xThunderPref.uriSupReg.test(selText) && !xThunderPref.proSupReg.test(selText);
            }
        }
        if (!downOffLineHidden) {
            //Show xThunder offLine anyway or if needed
            downOffLineHidden = !xThunderPref.getValue("downOffLineAnyway") && downHidden;
        }

        var showMenuIcons = xThunderPref.getValue("showMenuIcons");
        var showAllHotKey = xThunderPref.getValue("downAllHotKey");
        downloadMenu.className = showMenuIcons ? "menu-iconic" : "";
        downloadLinkItem.className = downloadOffLineItem.className = downloadAllItem.className = showMenuIcons ? "menuitem-iconic" : "";
        downloadLinkItem.setAttribute("hidden", downHidden || downSubMenuShown);
        downloadMenu.setAttribute("hidden", downHidden || !downSubMenuShown);
        downloadOffLineItem.setAttribute("hidden", downOffLineHidden);
        //Fix Bug 630830 before Firefox5 - "key" attribute changes to menuitems are not handled
        downloadAllItem.setAttribute("acceltext", showAllHotKey ? "Alt+F1" : "");
        downloadAllItem.setAttribute("key", showAllHotKey ? "xThunderAllKey" : "");
        downloadAllItem.setAttribute("hidden", downAllHidden);
        sepItem.setAttribute("hidden", downHidden && downAllHidden);
    },

    getDownloadAgent : function(event, addOffLine) {
        if(event && event.button != 0) {
            var agentList = xThunderPref.getEnabledAgentList(addOffLine);
            if (event.button == 1 && agentList.length >= 3) {
                // middle click to use third agent
                return agentList[2];
            } else if (event.button == 2 && agentList.length >= 2) {
                // right click to use second agent
                return agentList[1];
            }
        }

        //use default agent
        return xThunderPref.getValue("agentName");
    },

    endMenuClick : function(event) {
        // Firefox may not close context menu
        // and trigger wrong item,eg. Inspect element of Firebug
        this.ctxMenu.hidePopup();
        if (event && event.button == 2) {
            event.preventDefault();
            event.stopPropagation();
        }
    },

    pasteUrlFromClipborad : function() {
        var pastetext;
        try {
            var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            var str       = new Object();
            var strLength = new Object();
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);
            trans.getTransferData("text/unicode", str, strLength);
            if (str) {
                str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
                pastetext = str.data.substring(0, strLength.value / 2);
            }
        } catch (ex) { }
        
        if(pastetext && (xThunderPref.uriSupReg.test(pastetext) || xThunderPref.proSupReg.test(pastetext))) {
            return pastetext;
        } else {
            return "http://";
        }
    },

    OnThunderDownload : function(event, agentName, offLine) {
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;
        var agent = agentName || this.getDownloadAgent(event, xThunderPref.getValue("downOffLineSubMenu"));
        xThunder.init(htmlDocument.URL, 1, agent, offLine);
        
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
            if (url == "") {
                url = this.pasteUrlFromClipborad();
            }
            url = xThunderDecode.getDecodedUrl(url);
        }

        xThunder.addTask(url);
        this.endMenuClick(event);
        xThunder.callAgent();
    },

    OnThunderDownloadBy : function(agentName) {
        this.OnThunderDownload(null, agentName);
    },

    OnThunderDownloadOffLine : function(event) {
        var agent = this.getDownloadAgent(event);
        if (agent != "Thunder" && agent != "QQDownload") {
            agent = "Thunder";
        }
        this.OnThunderDownload(null, agent, true);
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

        var taskCount = linkCount + imageCount;
        var agent = this.getDownloadAgent(event);
        if (taskCount > 1 && (agent == "ToolbarThunder" || agent == "FlashGetMini")) {
            this.endMenuClick(event);
            alert(agent + " does not support batch downloading!");
            return false;
        }

        xThunder.init(htmlDocument.URL, taskCount, agent);

        for (var i=0; i<linkCount; ++i) {
            url = xThunderDecode.getDecodedNode(links[i]);
            if (xThunderDecode.udownReg.test(links[i].href)) {
                //udown link is got asynchronously, so do not use wrong textContent
                xThunder.addTask(url, "");
            } else {
                xThunder.addTask(url, links[i].textContent);
            }
        }

        for (var j=0; j<imageCount; ++j) {
            url = images[j].src;
            xThunder.addTask(url, images[j].getAttribute("alt") || images[j].title);
        }

        this.endMenuClick(event);
        xThunder.callAgent();
        return true;
    },

    OnThunderDownloadPopup : function(target) {
        xThunderPref.appendAgentList(target, "xThunderBy", "xThunderMain.OnThunderDownloadBy", true, xThunderPref.getValue("downOffLineSubMenu"));
        //set className of nonsupport agents item to agentNonsup
        var url;
        if (gContextMenu.onLink)
            url = gContextMenu.target.getAttribute("fg") || gContextMenu.linkURL;
        else if (gContextMenu.onImage)
            url = gContextMenu.target.src;
        else
            url = document.commandDispatcher.focusedWindow.getSelection().toString();

        url = xThunderDecode.getPreDecodedUrl(url);
        var agentsNonsup = xThunderPref.getAgentsNonsupURL(url);
        for (var i=0; i<agentsNonsup.length; ++i) {
            var subItem = document.getElementById("xThunderBy" + agentsNonsup[i]);
            if (subItem)
                subItem.className = "agentNonsup";
        }
    },

    OnThunderOptsPopup : function() {
        xThunderPref.appendAgentList(document.getElementById("xThunderOptsDefAgentPopup"), "xThunderOptsAgent", "xThunderMain.OnChangeAgent", true);
        document.getElementById("xThunderOptsUdown" + xThunderPref.getValue("udown")).setAttribute("checked", true);
        document.getElementById("xThunderOptsFilterExt").setAttribute("checked", xThunderPref.getValue("filterExt"));
        document.getElementById("xThunderOptsIncludeImages").setAttribute("checked", xThunderPref.getValue("includeImages"));
    },

    OnChangeAgent : function(newAgentName) {
        xThunderPref.setValue("agentName", newAgentName);
    },

    OnChangeUdown : function(udownIndex) {
        xThunderPref.setValue("udown", udownIndex);
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