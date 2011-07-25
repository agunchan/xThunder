var xThunderDecode = {
    downReg : /^\s*(ftp|https?|thunder|flashget|qqdl|fs2you|ed2k|magnet):/i,
    udownReg : /^http:\/\/u\.115\.com\/file\/(.+)/i,
    asyncReq : 0,

    // Flashgetx is encoded at least twice, so pre decode it.
    getPreDecodedUrl : function(url) {
        url = url.replace(/ /g, '');
        var isFlashGet = /^flashget:\/\//i.test(url);
        if (isFlashGet) {
            url = this.getDecodedUrl(url);
        }
        return url;
    },

    // Whether the link with special protocal can be decoded
    isProSupNode : function(link, url, protocals) {
        var contextmenu;
        for (var i=0; i<protocals.length; ++i) {
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
                    link.getAttribute("qhref") != null)
                || protocals[i] == "ed2k" &&
                    (url.indexOf("ed2k:") == 0 ||
                    link.getAttribute("ed2k"))
                || protocals[i] == "magnet" && url.indexOf("magnet:") == 0
                || protocals[i] == "fs2you" && url.indexOf("fs2you:") == 0
                || protocals[i] == "115" && this.udownReg.test(url)
                || protocals[i] == "udown" &&
                    link.id == "udown" && (contextmenu = link.getAttribute("onclick")) && contextmenu.indexOf("AddDownTask") != -1
                )
                return true;
        }

        return false;
    },

    getDecodedNode : function(link) {
        var url;
        var htmlDocument = link.ownerDocument;
        var referrer = htmlDocument.URL;

        //In special
        var matches;
        if (/^http:\/\/www\.duote\.com\/soft\//i.test(referrer)) {
            if (matches = htmlDocument.getElementById('quickDown')) {
                url = matches.href;
            }
        } else if (/^http:\/\/www\.ffdy\.cc\/.*\/\d+\.html/i.test(referrer)) {
            var sibling = link.previousSibling;
            var params;
            if (sibling && sibling.name == "checkbox" && (params = sibling.value)) {
                params = params.split("&");
                for (var i=0; i<params.length; ++i) {
                    if (matches = params[i].match(/xzurl=(.*)/)) {
                        url = matches[1];
                        break;
                    } else if (matches = params[i].match(/cid=(.*)/)) {
                        url = "http://thunder.ffdy.cc/" + matches[1] + "/" + link.innerHTML;
                    }
                }
            }
        } else if (/^http:\/\/xunbo\.cc\/Html\/GP\d+\.html/i.test(referrer)) {
            var sib = link.previousSibling;
            var param;
            if (sib && sib.name == "xcheckbox" && (param = sib.value)) {
                if (matches = param.match(/cid=(.*)&mc=(.*)/)) {
                    url = "http://bt.xunbo.cc/" + matches[1] + "/" + matches[2];
                }
            }
        } else if (/^http:\/\/lixian\.qq\.com\/main\.html/i.test(referrer)){
            if (matches = link.id.match(/task_dk_lc_(\d+)/)) {
                var taskId = matches[1];
                if (matches = htmlDocument.defaultView.wrappedJSObject.g_task_op) {
                    url = matches.last_task_info[taskId].file_url;
                }
            }
        } else if ((matches = link.getAttribute("oncontextmenu")) && matches.indexOf("Flashget_SetHref") != -1) {
            if (matches = matches.match(/Flashget_SetHref_js\(this,'(.+)','.*'\)/)) {
                url = matches[1];
            } else if (matches = htmlDocument.defaultView.wrappedJSObject.fUrl) {
                url = matches;
            }
        } else if (link.id == "udown" && (matches = link.getAttribute("onclick")) && matches.indexOf("AddDownTask") != -1) {
            url = referrer;
        }

        //In gernal
        if (!url) {
            while (link && typeof link.href == "undefined" && !this.downReg.test(link.name)) {
                link = link.parentNode;
            }
            if (!link) {
                url = "";
            } else {
                url = link.getAttribute('thunderhref') || link.getAttribute('fg')
                    || link.getAttribute('qhref') || link.getAttribute('ed2k')
                    || link.href || link.name;
            }
        }

        url = this.getDecodedUrl(url);
        if (link.getAttribute('href') == "#" && this.downReg.test(link.innerHTML) && url.replace(/#.*/i, "") == referrer.replace(/#.*/i, "")) {
            url = link.innerHTML.replace(/&nbsp;/g, "");
        }
        return url;
    },

    getDecodedUrl : function(url) {
        try {
            url = url.replace(/ /g, '');
            var oriUrl = url;
            if (/^(?:thunder|flashget|qqdl|fs2you):\/\//i.test(url))
            {
                url = this.decode64(url.replace(/^(?:thunder|flashget|qqdl|fs2you):\/\/|&.*|\/$/ig, ''))
                        .replace(/^AA|ZZ$|\[FLASHGET\]|\|\d+$/g, '');

                if (/^flashget:\/\//i.test(oriUrl) && url.match(/http:\/\/.*\/(Zmxhc2hnZXR4Oi8vfG1odHN8[^/]*)/)) {
                    // use oriUrl when it is actually flashgetx://|mhts|
                    url = oriUrl;
                } else if(/^ftp:\/\//i.test(url)) {
                    // decode username,dir when url is like ftp://%E7%BA%A2%E6%97@wt4.hltm.cc:3101/E5%BD%B1%E5.rmvb
                    url = decodeURIComponent(url);
                } else if (url.indexOf(".rayfile.com") != -1 && url.indexOf("http://") == -1) {
                    // cachefile*.rayfile.com
                    url = "http://" + url;
                }
            } else if (this.udownReg.test(url)) {
                url = this.uDown(url);
            }
        } catch (ex) {
            //no operation
        }

        return url;
    },

    //////////////////////////////////////////////////////////////////////
    //	Decode thunder,flashget,qqdownload and rayfile link -- Base64 Decode
    //////////////////////////////////////////////////////////////////////
    decode64 : function(input) {
        input = window.atob(input);                     //base64 decode
        try {
            input = decodeURIComponent(escape(input));  //utf8 decode
        } catch (e) {
            var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            converter.charset = "GBK";                  //gbk decode
            input = converter.ConvertToUnicode(input);
        }
        return input;
    },

    ////////////////////////////////////////////////////////////
    //	Get download link of 115u file
    ////////////////////////////////////////////////////////////
    uDown : function (url) {
        var matches = url.match(this.udownReg);
        var downUrl = url;

        if(matches)
        {
            var tcode = matches[1];
            url = 'http://uapi.115.com:80/?ct=upload_api&ac=get_pick_code_info&version=1172&pickcode='+tcode;
            var xmlhttp = new XMLHttpRequest();
            //max-persistent-connections-per-server is 6
            var async = xThunderDecode.asyncReq < 2;
            if (async) {
                ++xThunderDecode.asyncReq;
                xmlhttp.open('GET', url, true);
                xmlhttp.onreadystatechange = function(){
                    if (xmlhttp.readyState == 4) {
                        --xThunderDecode.asyncReq;
                        downUrl = xThunderDecode.getDownUrl(xmlhttp.responseText) || downUrl;
                        xThunder.addTask(downUrl);
                        xThunder.callAgent();
                    }
                };
            } else {
                xmlhttp.open('GET', url, async);
            }

            xmlhttp.setRequestHeader('User-Agent','115UDownClient 2.1.11.122');
            xmlhttp.setRequestHeader('Host','uapi.115.com');
            xmlhttp.setRequestHeader('Cache-Control','no-cache');
            xmlhttp.send(null);

            if (async) {
                return null;
            } else {
                downUrl = xThunderDecode.getDownUrl(xmlhttp.responseText) || downUrl;
            }
        }

        return downUrl;
    },

    getDownUrl : function(responseText) {
        var uDownUrl = JSON.parse(responseText).DownloadUrl;

        if (uDownUrl && uDownUrl.length > 0) {
            var index = xThunderPref.getValue('udown');  //tel,cnc,bak
            if (index >= uDownUrl.length) {
                index = 0;
            }
            return uDownUrl[index].Url;
        } else {
            return null;
        }
    }
}