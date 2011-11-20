#include "xThunder.h"


class DMThunder : public DMSupportCOM
{
protected:
	const char * getProgId() { return "ThunderAgent.Agent"; }
	virtual const bool isLite() { return false; }

public:
	static const char * getName() { return "Thunder"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM : void AddTask3(string pURL, string pFileName, string pPath, string pComments, string pReferURL, int nStartMode, int nOnlyFromOrigin, int nOriginThreadCount, string pCookie, string pCid)
		// COM : int CommitTasks2(int nIsAsync)
		// COM : int CommitTasks5(int thunderType, int nIsAsync)
		if (downInfo.count >= 1) 
		{
			_variant_t v[10];
			for (int j=0; j<downInfo.count; ++j) 
			{
				v[9] = downInfo.urls[j];
				v[8] = L"";
				v[7] = L"";
				v[6] = downInfo.descs[j];
				v[5] = downInfo.referrer;
				v[4] = -1;
				v[3] = 0;
				v[2] = -1;
				v[1] = downInfo.cookies[j];
				v[0] = downInfo.cids[j];
				invoke("AddTask3", v, 10);
			}

			if (this->isLite())
			{
				_variant_t v2[2];
				v2[0] = 1;
				v2[1] = 1;
				invoke("CommitTasks5", v2, 2);
			}
			else
			{	
				_variant_t v2[1];
				v2[0] = 1;
				invoke("CommitTasks2", v2, 1);
			}
		}

		return 0;
	}
};

class DMThunderLite : public DMThunder
{
protected:
	const bool isLite() { return true; }

public:
	static const char * getName() { return "ThunderLite"; }
};

class DMToolbarThunder : public DMSupportCOM
{
protected:
	const char * getProgId() { return "ToolbarThunder.DownloadAgent"; }

public:
	static const char * getName() { return "ToolbarThunder"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void AddTask(string Url, string Location, string Info, string strCID, string strCookie);
		_variant_t v[5];
		if (downInfo.count == 1)
		{
			v[4] = downInfo.urls[0];
			v[3] = downInfo.referrer;
			v[2] = downInfo.descs[0];
			v[1] = downInfo.cids[0];
			v[0] = downInfo.cookies[0];
			invoke("AddTask", v, 5);
		}
		
		return 0;
	}
};


class DMQQDownload : public DMSupportCOM
{
protected:
	const char * getProgId() { return "QQIEHelper.QQRightClick"; }

public:
	static const char * getName() { return "QQDownload"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void SendUrl2(string lpStrUrl, string lpStrRef, string lpStrRemark, string lpStrCookie, uint unP2PRate, uint unCID)
		if (downInfo.count == 1) 
		{
			_variant_t v[6];
			v[5] = downInfo.urls[0];
			v[4] = downInfo.referrer;
			v[3] = L"";
			v[2] = downInfo.cookies[0];
			v[1] = 0;
			v[0] = downInfo.cids[0];	//OffLine - 10600 or 10300(lixian.qq.com), Normal - 0 
			invoke("SendUrl2", v, 6);
		} 
		else if (downInfo.count > 1)
		{
			// COM: void AddCmnInfo(string lpStrCookie)
			// COM: void AddTask(string lpStrUrl, string lpStrRef, string lpStrRemark) 
			// COM: void SendMultiTask()
			_variant_t v[3];
			_variant_t v2[1];
			for (int j=0; j<downInfo.count; ++j) 
			{
				v2[0] = downInfo.cookies[j];
				invoke("AddCmnInfo", v2, 1);
				v[2] = downInfo.urls[j];
				v[1] = downInfo.referrer;
				v[0] = L"";
				invoke("AddTask", v, 3);
			}

			invoke("SendMultiTask", v, 0);
		}

		return 0;
	}
};


#import "IDManTypeInfo.tlb" 
#include "IDManTypeInfo.h"
#include "IDManTypeInfo_i.c"  

class DMIDM : public DMSupportCOM
{
protected:
	const char * getProgId() { return "IDMGetAll.IDMAllLinksProcessor"; }

public:
	static const char * getName() { return "IDM"; }

	long dispatch(DownloadInfo & downInfo)
	{
		ICIDMLinkTransmitter2* pIDM;
		COMCALL(CoCreateInstance(CLSID_CIDMLinkTransmitter, NULL, CLSCTX_LOCAL_SERVER,
			IID_ICIDMLinkTransmitter2, (void**)&pIDM));

		// COM: HRESULT SendLinkToIDM2(BSTR bstrUrl, BSTR bstrReferer, BSTR bstrCookies, BSTR bstrData, BSTR bstrUser, BSTR bstrPassword, BSTR bstrLocalPath, BSTR bstrLocalFileName, long lFlags, VARIANT reserved1, VARIANT reserved2);
		if (downInfo.count == 1) 
		{
			_variant_t varUrl,varReferrer,varCookie;
			VARIANT reserved;
			reserved.vt = VT_EMPTY;
			varUrl = downInfo.urls[0];
			varReferrer = downInfo.referrer;
			varCookie = downInfo.cookies[0];
			hr = pIDM->SendLinkToIDM2(varUrl.bstrVal, varReferrer.bstrVal, varCookie.bstrVal, NULL,
				NULL, NULL, NULL, NULL, 0, reserved, reserved);
		} 
		else if (downInfo.count > 1)
		{
			//COM : HRESULT SendLinksArray(BSTR location, VARIANT * pLinksArray);
			/*		pLinksArray ¨C a pointer to 2 dimensional SAFEARRAY array of BSTR strings. 
			For example, for N number of links, the size of the array will be (4 * N). 
			For i changing from 0 to N-1
			a[i,0] elements of the array are URLs to download, 
			a[i,1] are cookies for corresponding a[i,0] URLs,
			a[i,2] are link descriptions for corresponding URLs, 
			a[0,3] is the user agent, all others elements a[i,3] are not used and should be always NULL.
			*/
			SAFEARRAY *pSA = NULL;
			SAFEARRAYBOUND bound[2];
			bound[0].lLbound = 0;
			bound[0].cElements = downInfo.count;
			bound[1].lLbound = 0;
			bound[1].cElements = 4;
			if ( pSA = SafeArrayCreate(VT_BSTR, 2, bound) )
			{
				long index[2];
				_variant_t varReferrer,varUrl,varCookie,varDesc;
				varReferrer = downInfo.referrer;

				for (int j=0; j<downInfo.count; ++j) 
				{
					index[0] = j;

					varUrl = downInfo.urls[j];
					varCookie = downInfo.cookies[j];
					varDesc = downInfo.descs[j];

					index[1] = 0;
					SafeArrayPutElement(pSA, index, varUrl.bstrVal);

					index[1] = 1;
					SafeArrayPutElement(pSA, index, varCookie.bstrVal);

					index[1] = 2;
					SafeArrayPutElement(pSA, index, varDesc.bstrVal);

					index[1] = 3;
					SafeArrayPutElement(pSA, index, NULL);
				}
				VARIANT pLinksArray;
				VariantInit(&pLinksArray);
				pLinksArray.vt = VT_ARRAY | VT_BSTR;
				pLinksArray.parray = pSA;
				hr = pIDM->SendLinksArray(varReferrer.bstrVal, &pLinksArray);
				SafeArrayDestroy(pSA);
			} 
			else 
			{
				hr = SAFEARRAY_FAILED;
			}
		}
		pIDM->Release();
		return hr;
	}
};


// Safe array wrapper with <url, desc> pairs
class URLInfoArray
{
private:
	SAFEARRAY *pSA;

public:
	//<url, desc> pair array
	URLInfoArray(DownloadInfo & downInfo, bool includeReferrer)
	{
		pSA = NULL;
		SAFEARRAYBOUND bound[1];
		bound[0].lLbound = 0;
		bound[0].cElements = 2 * downInfo.count + (includeReferrer ? 1 : 0);
		if ( pSA = SafeArrayCreate(VT_VARIANT, 1, bound) ) 
		{
			long index[1];
			index[0] = 0;
			_variant_t varStr;

			if (includeReferrer)
			{
				varStr = downInfo.referrer;
				SafeArrayPutElement(pSA, index, &varStr);
				index[0]++;
			}

			for (int j=0; j<downInfo.count; ++j) 
			{
				varStr = downInfo.urls[j];
				SafeArrayPutElement(pSA, index, &varStr);
				index[0]++;

				varStr = downInfo.descs[j];
				SafeArrayPutElement(pSA, index, &varStr);
				index[0]++;
			}
		}
	}

	//<element> array
	URLInfoArray(_variant_t * elements, unsigned int count)
	{
		pSA = NULL;
		SAFEARRAYBOUND bound[1];
		bound[0].lLbound = 0;
		bound[0].cElements = count;
		if ( pSA = SafeArrayCreate(VT_VARIANT, 1, bound) ) 
		{
			long index[1];
			index[0] = 0;
			_variant_t varStr;

			for (int j=0; j<count; ++j) 
			{
				varStr = elements[j];
				SafeArrayPutElement(pSA, index, &varStr);
				index[0]++;
			}
		}
	}

	void asVariant(VARIANT * initVar) 
	{
		initVar->vt = VT_ARRAY | VT_BYREF | VT_VARIANT;
		initVar->pparray = &pSA;
	}

	void variantAccessData(VARIANT * initVar) 
	{
		initVar->vt = VT_BYREF | VT_VARIANT;
		SafeArrayAccessData(pSA, (void **)&(initVar->pparray));
	}

	void variantUnaccessData()
	{
		SafeArrayUnaccessData(pSA);
	}

	~URLInfoArray() 
	{
		if (pSA)
		{
			SafeArrayDestroy(pSA);
		}
	}
};


class DMBitComet : public DMSupportCOM
{
protected:
	const char * getProgId() { return "BitCometAgent.BcAgent"; }

public:
	static const char * getName() { return "BitComet"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void AddLink(ref object pHtmlText, ref object pUrl, ref object pInfo, ref object pRefUrl, ref object pTitle)
		if (downInfo.count == 1) 
		{
			_variant_t v[5];
			v[4] = L"";
			v[3] = downInfo.urls[0];
			v[2] = downInfo.descs[0];
			v[1] = downInfo.referrer;
			v[0] = L"";	
			invoke("AddLink", v, 5);
		} 
		else if (downInfo.count > 1)
		{
			// COM: void AddLinkList(ref object pHtmlText, ref object pRefUrl, ref object pTitle, ref object pLinkInfo, ref object pFlashLinkInfo)
			/*	pLinkInfo - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. <url, desc> pairs
				pFlashLinkInfo - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. <url, desc> pairs
			*/
			_variant_t v[5];
			v[4] = L"";
			v[3] = downInfo.referrer;
			v[2] = L"";	

			// write <url, desc> pairs to v[1] array
			URLInfoArray urlArr(downInfo, false);
			urlArr.asVariant(&v[1]);
			URLInfoArray flashArr(NULL, 0);
			flashArr.asVariant(&v[0]);
			if (v[1].pparray)
			{
				invoke("AddLinkList", v, 5);
			}
			else
			{
				return SAFEARRAY_FAILED;
			}
		}

		return 0;
	}
};


class DMFlashGet1 : public DMSupportCOM
{
protected:
	const char * getProgId() { return "JetCar.Netscape"; }

public:
	static const char * getName() { return "FlashGet1"; }

	long dispatch(DownloadInfo & downInfo)
	{
		try 
		{
			prepareCOMObj();
		} 
		catch (_com_error& e)
		{
			//Check version 1.9
			prepareCOMObj("FG2CatchUrl.Netscape");
		}

		// COM: void AddUrl(string url, string desc, string ref)
		if (downInfo.count == 1)
		{
			_variant_t v[3];
			v[2] = downInfo.urls[0];
			v[1] = downInfo.descs[0];
			v[0] = downInfo.referrer;
			invoke("AddUrl", v, 3);
		} 
		else if (downInfo.count > 1)
		{
			// COM : void AddUrlList(ref object pVariant)
			//		pVariant - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. referrer + <url, desc> pairs
			_variant_t v;
			URLInfoArray urlArr(downInfo, true);
			urlArr.asVariant(&v);
			if (v.pparray)
			{
				invoke("AddUrlList", &v, 1);
			}
			else
			{
				return SAFEARRAY_FAILED;
			}
		}
	}
};

class DMFlashGet3 : public DMSupportCOM
{
protected:
	const char * getProgId() { return "BHO.IFlashGetNetscapeEx"; }
	virtual const wchar_t * getModuleName() { return L"FlashGet3"; }

public:
	static const char * getName() { return "FlashGet3"; }

	long dispatch(DownloadInfo & downInfo)
	{
		try 
		{
			prepareCOMObj();
		} 
		catch (_com_error& e)
		{
			//before v1.9
			DMFlashGet1 fg;
			return fg.dispatch(downInfo);
		}
		
		bool isFlashGet3 = !wcscmp(L"FlashGet3", getModuleName());

		// COM: void AddUrlEx(string url, string text, string ref, string modulename, string cookies, string flag, int nFromStyle)
		if (downInfo.count == 1)
		{
			int len = isFlashGet3 ? 7 : 6;
			_variant_t v[7];
			v[len-1] = downInfo.urls[0];
			v[len-2] = downInfo.descs[0];
			v[len-3] = downInfo.referrer;
			v[len-4] = getModuleName();
			v[len-5] = downInfo.cookies[0];
			v[len-6] = L"0";
			if (isFlashGet3)
			{
				v[len-7] = 3;
			}
			invoke("AddUrlEx", v, len);
		} 
		else if (downInfo.count > 1 && isFlashGet3)
		{
			// COM : void AddAll(ref object pVariant, string bRef, string modulename, string cookies, string flag)
			//		pVariant - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. referrer + <url, desc> pairs
			_variant_t v[5];
			URLInfoArray urlArr(downInfo, true);
			urlArr.asVariant(&v[4]);
			if (v[4].pparray)
			{
				v[3] = downInfo.referrer;
				v[2] = getModuleName();
				v[1] = downInfo.cookies[0];
				v[0] = L"0";
				invoke("AddAll", v, 5);
			}
			else
			{
				return SAFEARRAY_FAILED;
			}
		}

		return 0;
	}
};

class DMFlashGetMini : public DMFlashGet3
{
protected:
	const char * getProgId() { return "BHO.IFlashGetNetscape"; }
	const wchar_t * getModuleName() { return L"FlashGetMini"; }

public:
	static const char * getName() { return "FlashGetMini"; }
};

class DMOrbit : public DMSupportCOM
{
protected:
	const char * getProgId() { return "Orbitmxt.Orbit"; }

public:
	static const char * getName() { return "Orbit"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void download(string url, string note, string referer, string cookie, int flags = 0)
		if (downInfo.count == 1) 
		{
			_variant_t v[4];
			v[3] = downInfo.urls[0];
			v[2] = downInfo.descs[0];
			v[1] = downInfo.referrer;
			v[0] = downInfo.cookies[0];
			invoke("download", v, 4);
		} 
		else if (downInfo.count > 1)
		{
			// COM: void downloadList(ref object urls, ref object notes, string referer, string cookie)
			_variant_t v[4];
			URLInfoArray urlsArr(downInfo.urls, downInfo.count);
			urlsArr.asVariant(&v[3]);
			URLInfoArray descsArr(downInfo.descs, downInfo.count);
			descsArr.asVariant(&v[2]);
			if (v[3].pparray && v[2].pparray)
			{
				v[1] = downInfo.referrer;
				v[0] = downInfo.cookies[0];
				invoke("downloadList", v, 4);
			}	
			else
			{
				return SAFEARRAY_FAILED;
			}
		}

		return 0;
	}
};

class DMFDM : public DMSupportCOM
{
protected:
	const char * getProgId() { return "WG.WGUrlReceiver"; }

public:
	static const char * getName() { return "FDM"; }

	long dispatch(DownloadInfo & downInfo)
	{
		if (downInfo.count == 1) 
		{
			prepareCOMObj();
			_variant_t v;
			set("Url", &downInfo.urls[0]);
			set("Comment", &downInfo.descs[0]);
			set("Referer", &downInfo.referrer);
			set("Cookies", &downInfo.cookies[0]);
			invoke("AddDownload", &v, 0);
		}
		else if (downInfo.count > 1)
		{
			prepareCOMObj("WG.WGUrlListReceiver");
			_variant_t v;
			set("Referer", &downInfo.referrer);
			set("Cookies", &downInfo.cookies[0]);
			for (int j=0; j<downInfo.count; ++j) 
			{
				set("Url", &downInfo.urls[j]);
				set("Comment", &downInfo.descs[j]);
				invoke("AddUrlToList", &v, 0);
			}
			invoke("ShowAddUrlListDialog", &v, 0);
		}

		return 0;
	}
};

class DMUDown : public DMSupportCOM
{
protected:
	const char * getProgId() { return "UDiskAgent.UDiskAgentObj"; }

public:
	static const char * getName() { return "UDown"; }

	long dispatch(DownloadInfo & downInfo)
	{
		try
		{
			prepareCOMObj();
		}
		catch (_com_error& e)
		{
			//before v2.2
			prepareCOMObj("UDownAgent.UDownAgentObj");
		}

		// COM: bool AddDownTask(string AUrl, string AComments, string ARefer)
		if (downInfo.count == 1) 
		{
			_variant_t v[3];
			v[2] = downInfo.urls[0];
			v[1] = downInfo.descs[0];
			v[0] = downInfo.referrer;
			invoke("AddDownTask", v, 3);
		} 
		else if (downInfo.count > 1)
		{
			// COM: void DownAllLink(object AURLList)
			_variant_t v[1];
			URLInfoArray urlArr(downInfo, true);
			urlArr.asVariant(&v[0]);
			if (v[0].pparray)
			{
				invoke("DownAllLink", v, 1);
			}
			else
			{
				return SAFEARRAY_FAILED;
			}
		}

		return 0;
	}
};

class DMNetTransport : public DMSupportCOM
{
protected:
	const char * getProgId() { return "NXIEHelper.NXIEAddURL"; }

public:
	static const char * getName() { return "NetTransport"; }

	long dispatch(DownloadInfo & downInfo)
	{
		try
		{
			prepareCOMObj();
		}
		catch (_com_error& e)
		{
			//before v2
			prepareCOMObj("NTIEHelper.NTIEAddUrl");
		}

		// COM: void AddLink(string bstrReferer, string bstrURL, string bstrComment)
		if (downInfo.count == 1) 
		{
			_variant_t v[3];
			v[2] = downInfo.referrer;
			v[1] = downInfo.urls[0];
			v[0] = downInfo.descs[0];
			invoke("AddLink", v, 3);
		} 
		else if (downInfo.count > 1)
		{
			// COM: void AddList(string bstrReferer, ref object bstrURLs, ref object bstrComments)
			_variant_t v[3];
			v[2] = downInfo.referrer;
			URLInfoArray urlArr(downInfo.urls, downInfo.count);
			urlArr.variantAccessData(&v[1]);
			URLInfoArray descArr(downInfo.descs, downInfo.count);
			descArr.variantAccessData(&v[0]);
			if (v[1].pparray && v[0].pparray)
			{
				invoke("AddList", v, 3);
				urlArr.variantUnaccessData();
				descArr.variantUnaccessData();
			}
			else
			{
				return SAFEARRAY_FAILED;
			}
		}

		return 0;
	}
};


//////////////////////////////////////////////////////////////////////////
//
// Register download manager
//
//////////////////////////////////////////////////////////////////////////
#define CREATE_DM(agent)	if(!strcmp(agentname,agent::getName())) return new agent()
DMSupportCOM * DMSupportCOMFactory::getDMAgent(const char *agentname)
{
	CREATE_DM(DMThunder);
	CREATE_DM(DMToolbarThunder);
	CREATE_DM(DMQQDownload);
	CREATE_DM(DMIDM);
	CREATE_DM(DMBitComet);
	CREATE_DM(DMFlashGet3);
	CREATE_DM(DMFlashGetMini);
	CREATE_DM(DMThunderLite);
	CREATE_DM(DMOrbit);
	CREATE_DM(DMFDM);
	CREATE_DM(DMUDown);
	CREATE_DM(DMNetTransport);

	return NULL;
}