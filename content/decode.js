var xThunderDecode = {
    // Flashgetx is encoded at least twice, so pre decode it.
    getPreDecodedUrl : function(url) {
        url = url.replace(/ /g, "");
        var isFlashGet = /^flashget:\/\//i.test(url);
        if (isFlashGet) {
            url = this.getDecodedUrl(url);
        }
        return url;
    },

    // Whether the link with special protocal can be decoded
    isProSupNode : function(link, url, protocals) {
        var attr;
        for (var i=0; i<protocals.length; ++i) {
            if (protocals[i] == "thunder" && 
                    ( url.indexOf("thunder:") == 0 ||
                      link.getAttribute("thunderhref") || 
                      link.getAttribute("downloadurl") ||
                      (attr = link.getAttribute("oncontextmenu")) && attr.indexOf("ThunderNetwork_SetHref") != -1 ||
                      (attr = link.getAttribute("onclick")) && attr.indexOf("thunder://") != -1
                    )    
                || protocals[i] == "flashget" &&
                    ( url.indexOf("flashget:") == 0 ||
                      link.getAttribute("fg") ||
                      (attr = link.getAttribute("oncontextmenu")) && attr.indexOf("Flashget_SetHref") != -1
                    )
                || protocals[i] == "qqdl" &&
                    ( url.indexOf("qqdl:") == 0 ||
                      link.getAttribute("qhref")
                    )
                || protocals[i] == "ed2k" &&
                    ( url.indexOf("ed2k:") == 0 ||
                      link.getAttribute("ed2k")
                    )
                || protocals[i] == "magnet" && url.indexOf("magnet:") == 0
                || protocals[i] == "fs2you" && url.indexOf("fs2you:") == 0
                || protocals[i] == "udown" && link.id == "udown" && (attr = link.getAttribute("onclick")) && attr.indexOf("AddDownTask") != -1
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
            if (matches = htmlDocument.getElementById("quickDown")) {
                url = matches.href;
            }
        } else if (!link.getAttribute("thunderhref") && (matches = link.getAttribute("oncontextmenu")) && matches.indexOf("ThunderNetwork_SetHref") != -1) {
            // thunder url in oncontextmenu attribute
            var input = link.parentNode;
            var params,cid,mc;
            if ((input = input.firstChild) && input.getAttribute("type") == "checkbox" && (params = input.value)) {    
                params = params.split("&");
                for (var i=0; i<params.length; ++i) {
                    if (matches = params[i].match(/xzurl=(.*)/)) {
                        url = matches[1];
                        break;
                    } else if (matches = params[i].match(/cid=(.*)/)) {
                        cid = matches[1];
                    } else if (matches = params[i].match(/mc=(.*)/)) {
                        mc = matches[1];
                    }
                }
                
                if (!url) {
                    if (/^http:\/\/www\.ffdy\.cc\//i.test(referrer)) {
                        url = "http://thunder.ffdy.cc/" + cid + "/" + link.innerHTML.replace(/&nbsp;/g, "");
                    } else if (/^http:\/\/www\.7369\.cc\//i.test(referrer)) {
                        url = "http://www.7369.com/" + cid + "/" + link.innerHTML.replace(/&nbsp;/g, "");
                    } else if (/^http:\/\/xunbo\.cc\//i.test(referrer)) {
                        url = "http://bt.xunbo.cc/" + cid + "/" + mc;
                    } 
                }
            }     
        } else if (!link.getAttribute("thunderhref") && (matches = link.getAttribute("onclick")) && matches.indexOf("thunder://") != -1) {
            // thunder url in onclick attribute
            if (matches = matches.match(/'(thunder:\/\/.*?)'/)) {
                url = matches[1];
            }
        } else if (!link.getAttribute("fg") && (matches = link.getAttribute("oncontextmenu")) && matches.indexOf("Flashget_SetHref") != -1) {
            // flashget url in oncontextmenu attribute
            if (matches = matches.match(/Flashget_SetHref_js\(this,(?:'(.+)','.*')|(?:'(flashget:.*)')\)/)) {
                url = matches[1] || matches[2];
            } else if (matches = htmlDocument.defaultView.wrappedJSObject.fUrl) {
                url = matches;
            }
        } else if (link.id == "udown" && (matches = link.getAttribute("onclick")) && matches.indexOf("AddDownTask") != -1) {
            // download url in subling nodes
            url = this.getUDownUrl(link, referrer);
        }

        //In gernal
        if (!url) {
            while (link && typeof link.href == "undefined" && !xThunderPref.proSupReg.test(link.name)) {
                link = link.parentNode;
            }
            if (!link) {
                url = "";
            } else {
                url = link.getAttribute("thunderhref") || link.getAttribute("downloadurl")
                    || link.getAttribute("fg") || link.getAttribute("qhref") || link.getAttribute("ed2k")
                    || link.href || link.name;
            }
        }

        url = this.getDecodedUrl(url);
        return url;
    },

    getDecodedUrl : function(url) {
        try {
            url = url.replace(/ /g, "");
            var oriUrl = url;
            if (/^(?:thunder|flashget|qqdl|fs2you):\/\//i.test(url)) {
                url = this.decode64(url.replace(/^(?:thunder|flashget|qqdl|fs2you):\/\/|&.*|\/$/ig, ""))
                        .replace(/^AA|ZZ$|\[FLASHGET\]|\|\d+$/g, "");
                if (/^flashget:\/\//i.test(oriUrl)) {
                    if (url.match(/http:\/\/.*\/(Zmxhc2hnZXR4Oi8vfG1odHN8[^/]*)/))
                        url = oriUrl; // use oriUrl when it is actually flashgetx://|mhts|
                    else
                        url = this.getDecodedUrl(url);  // decode twice
                } else if(/^ftp:\/\//i.test(url)) {
                    // decode username,dir when url is like ftp://%E7%BA%A2%E6%97@wt4.hltm.cc:3101/E5%BD%B1%E5.rmvb
                    url = decodeURIComponent(url);
                } else if (url.indexOf(".rayfile.com") != -1 && url.indexOf("http://") == -1) {
                    // cachefile*.rayfile.com
                    url = "http://" + url;
                }
            } 
        } catch (ex) {
            //no operation
        }

        return url;
    },

    // Decode thunder,flashget,qqdownload and rayfile link -- Base64 Decode
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

    // Get download link of 115u file
    getUDownUrl : function (link, referrer) {
        var downUrls = [];
        var index = xThunderPref.getValue("udown");  //tel,cnc
        var downBox = link.parentNode.childNodes; //the id of link is udown
        for (var j=0; j<downBox.length; j++) {
            if (downBox[j].getAttribute && downBox[j].getAttribute("class") == "btn-wrap") {
                downBox = downBox[j].childNodes;
                for (var i=0; i<downBox.length; i++) {
                    if (downBox[i].href) {
                        if (index == 0 && downBox[i].textContent.indexOf("电信") != -1
                        || index == 1 && downBox[i].textContent.indexOf("联通") != -1) {
                            return downBox[i].href;
                        }

                        downUrls.push(downBox[i].href);
                    }
                }
            }
        }
    
        if (downUrls.length == 0) {
            return referrer;
        } 
        
        if (downUrls.length == 1) {
            // only one url
            index = 0;  
        } else if (index == 2) {
            // auto choose the url having nearer ip
            var urlOne = downUrls[0];
            var urlTwo = downUrls[1];
            var urlReg = /http:\/\/(\d+)\.\d+\.\d+\.\d+\/.*&u=(\d+)\.\d+\.\d+\.\d+@/;
            var matchesOne, matchesTwo;
            if ((matchesOne = urlOne.match(urlReg)) && (matchesTwo = urlTwo.match(urlReg))
                && matchesOne[2] == matchesTwo[2]) {
                //compare ipv4 Leading address
                index = Math.abs(matchesOne[1] - matchesOne[2]) < Math.abs(matchesTwo[1] - matchesTwo[2])
                        ? 0 : 1;
            } else {
                index = downUrls.length - 1;
            }
        } 

        return downUrls[index];
    }
}