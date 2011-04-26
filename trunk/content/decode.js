var xThunderDownReg = /^\s*(ftp|https?|thunder|flashget|qqdl|fs2you|ed2k|magnet):/i;

function getDecodedNode(link){
    var url;
    var htmlDocument = link.ownerDocument;
    var referrer = htmlDocument.URL;

    //In special
    var matches;
    if (/^http:\/\/www\.duote\.com\/soft\//i.test(referrer)) {
        if (matches = htmlDocument.getElementById('quickDown')) {
            url = matches.href;
        }
    } else if (/^http:\/\/download\.pchome\.net\//i.test(referrer) || /^http:\/\/dl\.pconline\.com\.cn\//i.test(referrer)) {
        url = link.href;
        if (-1 != url.indexOf('javascript:') || referrer + "#" == url) {
            url = htmlDocument.defaultView.wrappedJSObject.fUrl;
        }
    } else if (/^http:\/\/www\.ffdy\.cc\/.*\/\d+\.html/i.test(referrer)) {
        if (link.previousSibling && (url = link.previousSibling.value)) {
            if (matches = url.match(/xzurl=(.*)&/)) {
                url = matches[1];
            } else if (matches = url.match(/cid=(.*)&/)) {
                url = "http://thunder.ffdy.cc/" + matches[1] + "/" + link.innerHTML;
            }
        }
    }

    //In gernal
    if (!url) {
        while (link && !link.href && !xThunderDownReg.test(link.name)) {
            link = link.parentNode;
        }
        if (!link) {
            url = "";
        } else {
            url = link.getAttribute('thunderhref') || link.getAttribute('fg')
                || link.getAttribute('qhref') || link.href || link.name;
        }
    }

    url = getDecodedUrl(url);
    if (referrer && url == referrer + "#" && xThunderDownReg.test(link.innerHTML)) {
        url = link.innerHTML.replace(/&nbsp;/g, "");
    }
    return url;
}

function getDecodedUrl(url){
    url = url.replace(/ /g, '');
	if (/^(?:flashget|qqdl|fs2you):\/\//i.test(url))
	{
		url = decode64(url.replace(/^(?:thunder|flashget|qqdl|fs2you):\/\/|&.*|\/$/ig, ''))
				.replace(/^AA|ZZ$|\[FLASHGET\]|\|\d+$/g, '');

        if (url.indexOf(".rayfile.com") != -1 && url.indexOf("http://") == -1)
        {
            url = "http://" + url;
        }
	} else if (/^http:\/\/u\.115\.com\/file\/.+/i.test(url)) {
		url = uDown(url);
	}
    return url;
}

//////////////////////////////////////////////////////////////////////
//	Decode flashget,qqdownload and rayfile link -- Base64 Decode
//////////////////////////////////////////////////////////////////////
var base64keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function decode64(input) {
	var output = "";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	var i = 0;

	// remove all characters that are not A-Z, a-z, 0-9, +, /, or =
	var base64test = /[^A-Za-z0-9\+\/\=]/g;
	if (base64test.exec(input)) {
		alert("There were invalid base64 characters in the input text.\n"
				+ "Valid base64 characters are A-Z, a-z, 0-9, '+', '/', and '='\n"
				+ "Expect errors in decoding.");
	}
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	do {
		enc1 = base64keyStr.indexOf(input.charAt(i++));
		enc2 = base64keyStr.indexOf(input.charAt(i++));
		enc3 = base64keyStr.indexOf(input.charAt(i++));
		enc4 = base64keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}

		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";

	} while (i < input.length);

	return _utf8_decode(output);
}

// private method for UTF-8 decoding
function _utf8_decode(utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
}

////////////////////////////////////////////////////////////
//	Get download link of 115u file
////////////////////////////////////////////////////////////
function uDown(url){
    var matches = url.match(/http:\/\/u\.115\.com\/file\/(.+)/i);
    var downUrl = url;
    
	if(matches)
	{
		var tcode = matches[1];
        url = 'http://u.115.com/?ct=upload_api&ac=get_pick_code_info&version=1169&pickcode='+tcode;
		var xmlhttp = new XMLHttpRequest();
        if (uDown.prototype.ayncReq == undefined) {
            uDown.prototype.ayncReq = 0;
        }
        //max-persistent-connections-per-server is 6
        var asyn = uDown.prototype.ayncReq < 2;
        if (asyn) {
            ++uDown.prototype.ayncReq;
            xmlhttp.open('GET', url, asyn);
            xmlhttp.onreadystatechange = function(){
                if (xmlhttp.readyState == 4) {
                    --uDown.prototype.ayncReq;
                    var json = JSON.parse(xmlhttp.responseText);
                    if (json.DownloadUrl) {
                        downUrl = json.DownloadUrl[xThunderPref.getValue('udown')].Url; //tel,cnc,bak
                    }
                    xThunder.addTask(downUrl);
                    xThunder.callAgent();
                }
            };
        } else {
            xmlhttp.open('GET', url, asyn);
        }

        xmlhttp.setRequestHeader('User-Agent','Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)');
		xmlhttp.setRequestHeader('Accept-Charset','');
		xmlhttp.setRequestHeader('Host','u.115.com');
		xmlhttp.setRequestHeader('Cache-Control','no-cache');
        xmlhttp.send(null);

        if (asyn) {
            return null;
        } else {
            var json = JSON.parse(xmlhttp.responseText);
            if (json.DownloadUrl) {
                downUrl = json.DownloadUrl[xThunderPref.getValue('udown')].Url; //tel,cnc,bak
            }
        }
    }

	return downUrl;
}