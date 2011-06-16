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
            if (link.previousSibling && (url = link.previousSibling.value)) {
                if (matches = url.match(/xzurl=(.*)&/)) {
                    url = matches[1];
                } else if (matches = url.match(/cid=(.*)&/)) {
                    url = "http://thunder.ffdy.cc/" + matches[1] + "/" + link.innerHTML;
                }
            }
        } else if ((matches = link.getAttribute("oncontextmenu")) && matches.indexOf("Flashget_SetHref") != -1) {
            var JSObj = htmlDocument.defaultView.wrappedJSObject;
            if ((matches = JSObj.fUrl) || (matches = JSObj.url)) {
                url = matches;
            }
        } else if (link.id == "udown" && (matches = link.getAttribute("onclick")) && matches.indexOf("AddDownTask") != -1) {
            url = referrer;
        }

        //In gernal
        if (!url) {
            while (link && !link.href && !this.downReg.test(link.name)) {
                link = link.parentNode;
            }
            if (!link) {
                url = "";
            } else {
                url = link.getAttribute('thunderhref') || link.getAttribute('fg')
                    || link.getAttribute('qhref') || link.href || link.name;
            }
        }

        url = this.getDecodedUrl(url);
        if (referrer && url == referrer + "#" && this.downReg.test(link.innerHTML)) {
            url = link.innerHTML.replace(/&nbsp;/g, "");
        }
        return url;
    },

    getDecodedUrl : function(url) {
        try {
            url = url.replace(/ /g, '');
            var isFlashGet = /^flashget:\/\//i.test(url);
            if (isFlashGet || /^(?:thunder|qqdl|fs2you):\/\//i.test(url))
            {
                url = this.decode64(url.replace(/^(?:thunder|flashget|qqdl|fs2you):\/\/|&.*|\/$/ig, ''))
                        .replace(/^AA|ZZ$|\[FLASHGET\]|\|\d+$/g, '');
                        
                if (isFlashGet && (url = url.match(/http:\/\/.*\/(Zmxhc2hnZXR4Oi8vfG1odHN8[^/]*)/))) {
                    //flashgetx://|mhts|
                    url = window.atob((url[1]));
                } else if (url.indexOf(".rayfile.com") != -1 && url.indexOf("http://") == -1) {
                    //rayfile
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