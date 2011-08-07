///////////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js,pref.js,decode.js
///////////////////////////////////////////////////////////////////
window.addEventListener("load", function(){
    xThunderMain.addContextMenuListener();
    xThunderMain.setIconVisible(xThunderPref.getValue("showStatusIcon"));
    xThunderMain.addClickSupport();
}, false);

var xThunderMain = {
    ctxMenu : null,
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
                if (ev.ctrlKey && xThunderPref.getValue("ctrlNoMonitor")) {
                    //remember value is 0:never down, 1: auto down, -1: no down this time
                    if (remExt == 1) {
                        xThunderPref.setValue('remember', -1);
                    }

                    //udown link is got asynchronously, so decodedUrl may be null
                    if(!xThunderDecode.udownReg.test(url)) {
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
            }, true);   // end gBrowser click event

            xThunderMain.clickVntAdded = true;
        }
    },

    addContextMenuListener : function() {
        this.ctxMenu = document.getElementById('contentAreaContextMenu');
        this.ctxMenu.addEventListener('popupshowing', function(event){
            if (event.target == this)
                xThunderMain.OnContextMenu();
        }, false);
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
        var defAgentName = xThunderPref.getValue("agentName");

        if (!downHidden) {
            //Show download link in context menu if needed
            if (gContextMenu.onLink || gContextMenu.onImage) {
                downHidden = false;
            } else {
                var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
                downHidden = !xThunderDecode.downReg.test(selText);
            }
        }
        downOffLineHidden = downHidden || downOffLineHidden || (defAgentName != "Thunder" && defAgentName != "QQDownload");
        downAllHidden = downAllHidden || defAgentName == "ToolbarThunder";

        var showMenuIcons = xThunderPref.getValue("showMenuIcons");
        var showAllHotKey = xThunderPref.getValue("downAllHotKey");
        downloadMenu.className = showMenuIcons ? "menu-iconic" : "";
        downloadLinkItem.className = downloadOffLineItem.className = downloadAllItem.className = showMenuIcons ? "menuitem-iconic" : "";
        downloadLinkItem.setAttribute("hidden", downHidden || downSubMenuShown);
        downloadMenu.setAttribute("hidden", downHidden || !downSubMenuShown);
        downloadOffLineItem.setAttribute("hidden", downHidden || downOffLineHidden);
        //Fix Bug 630830 before Firefox5 - "key" attribute changes to menuitems are not handled
        downloadAllItem.setAttribute("acceltext", showAllHotKey ? "Alt+F1" : "");
        downloadAllItem.setAttribute("key", showAllHotKey ? "xThunderAllKey" : "");
        downloadAllItem.setAttribute("hidden", downAllHidden);
        sepItem.setAttribute("hidden", downHidden && downAllHidden);
    },

    getDownloadAgent : function(event) {
        if(event && event.button != 0) {
            var agentList = xThunderPref.getFixedAgentList();
            for (var i=0; i<agentList.length-1; ++i) {
                var agentItem = agentList[i].split("|");
                var agent = agentItem[0];
                if (agentItem.length == 1) {
                    if (event.button == 2 && i==1
                        || event.button == 1 && i==2)
                        //right click using second agent, middle click using third agent
                        return agent;
                }
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

    OnThunderDownload : function(event, agentName, offLine) {
        var htmlDocument = document.commandDispatcher.focusedWindow.document;
        var url;
        xThunder.init(htmlDocument.URL, 1, agentName || this.getDownloadAgent(event), offLine);
        
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
        this.endMenuClick(event);
        xThunder.callAgent();
    },

    OnThunderDownloadBy : function(agentName) {
        this.OnThunderDownload(null, agentName);
    },

    OnThunderDownloadOffLine : function(event) {
        var agent = this.getDownloadAgent(event);
        if (agent != "Thunder" && agent != "QQDownload") {
            agent = xThunderPref.getValue("agentName");
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

        if (xThunderPref.getValue("agentName") == "ToolbarThunder" && linkCount+imageCount > 1) {
            alert('MiniThunder does not support batch downloading!');
            return false;
        }

        var totalTask = linkCount+imageCount;
        var filerExtStr = (totalTask > 1 && xThunderPref.getValue("filterExt"))
                            ? xThunderPref.getValue("supportExt") : "";
        xThunder.init(htmlDocument.URL, totalTask, this.getDownloadAgent(event));

        for (var i=0; i<linkCount; ++i) {
            url = xThunderDecode.getDecodedNode(links[i]);
            if (!xThunderDecode.udownReg.test(links[i].href)) {
                xThunder.addTask(url, links[i].textContent, filerExtStr);
            } else {
                //udown link is got asynchronously, so do not use wrong textContent
                xThunder.addTask(url, "", filerExtStr);
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
        xThunderPref.appendAgentList(target, 'xThunderBy', 'xThunderMain.OnThunderDownloadBy', true);
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
            var subItem = document.getElementById("xThunderBy" + agentsNonsup[i]);
            if (subItem)
                subItem.className = "agentNonsup";
        }
    },

    OnThunderOptsPopup : function() {
        xThunderPref.appendAgentList(document.getElementById("xThunderOptsDefAgentPopup"), 'xThunderOptsAgent', 'xThunderMain.OnChangeAgent', true);
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
        window.openDialog('chrome://xthunder/content/options.xul', 'xthunderOptions', 'chrome,modal=yes,resizable=no').focus();
    }
};