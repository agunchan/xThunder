#include "xThunder.h"


class DMThunder : public DMSupportCOM
{
protected:
	const char * getProgId() { return "ThunderAgent.Agent"; }

public:
	static const char * getName() { return "Thunder"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM : void AddTask2(string pURL, string pFileName, string pPath, string pComments, string pReferURL, int nStartMode, int nOnlyFromOrigin, int nOriginThreadCount, string pCookie)
		// COM : int CommitTasks2(int nIsAsync)
		_variant_t v[9];
		for (int j=0; j<downInfo.count; ++j) 
		{
			v[8] = downInfo.urls[j];
			v[7] = L"";
			v[6] = L"";
			v[5] = downInfo.descs[j];
			v[4] = downInfo.referrer;
			v[3] = -1;
			v[2] = 0;
			v[1] = -1;
			v[0] = downInfo.cookies[j];
			invoke("AddTask2", v, 9);
		}

		_variant_t v2[1];
		v2[0] = 1;
		invoke("CommitTasks2", v2, 1);

		return 0;
	}
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
			v[2] = L"";
			v[1] = L"";
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
	virtual unsigned int getCId() { return 0; }		//OFFLine = 10600

public:
	static const char * getName() { return "QQDownload"; }

	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void SendUrl2(string lpStrUrl, string lpStrRef, string lpStrRemark, string lpStrCookie, uint unP2PRate, uint unCID)
		if (downInfo.count == 1) {
			_variant_t v[6];
			v[5] = downInfo.urls[0];
			v[4] = downInfo.referrer;
			v[3] = L"";
			v[2] = downInfo.cookies[0];
			v[1] = 0;
			v[0] = getCId();		
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
		if (downInfo.count == 1) {
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
				//SafeArray Create FAILED 
				hr = -1;
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
	SAFEARRAY *pSA_URL;

public:
	URLInfoArray(DownloadInfo & downInfo, bool includeReferrer)
	{
		pSA_URL = NULL;
		SAFEARRAYBOUND bound_url[1];
		bound_url[0].lLbound = 0;
		bound_url[0].cElements = 2 * downInfo.count + (includeReferrer ? 1 : 0);
		if ( pSA_URL = SafeArrayCreate(VT_VARIANT, 1, bound_url) ) 
		{
			long index[1];
			index[0] = 0;
			_variant_t varStr;

			if (includeReferrer)
			{
				varStr = downInfo.referrer;
				SafeArrayPutElement(pSA_URL, index, &varStr);
				index[0]++;
			}

			for (int j=0; j<downInfo.count; ++j) 
			{
				varStr = downInfo.urls[j];
				SafeArrayPutElement(pSA_URL, index, &varStr);
				index[0]++;

				varStr = downInfo.descs[j];
				SafeArrayPutElement(pSA_URL, index, &varStr);
				index[0]++;
			}
		}
	}

	void asVariant(VARIANT * initVar) {
		initVar->vt = VT_ARRAY | VT_BYREF | VT_VARIANT;
		initVar->pparray = &pSA_URL;
	}

	~URLInfoArray() 
	{
		if (pSA_URL)
		{
			SafeArrayDestroy(pSA_URL);
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
		if (downInfo.count == 1) {
			_variant_t v[5];
			v[4] = L"";
			v[3] = downInfo.urls[0];
			v[2] = downInfo.descs[0];
			v[1] = downInfo.referrer;
			v[0] = L"";	
			invoke("AddLink", v, 5);
		} 
		else if (downInfo.count >= 1)
		{
			// COM: void AddLinkList(ref object pHtmlText, ref object pRefUrl, ref object pTitle, ref object pLinkInfo, ref object pFlashLinkInfo)
			/*		pLinkInfo - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. <url, desc> pairs
			pFlashLinkInfo - a pointer to 1 dimensional SAFEARRAY array of VT_VARIANT strings. <url, desc> pairs
			*/
			_variant_t v[5];
			v[4] = L"";
			v[3] = downInfo.referrer;
			v[2] = L"";	

			// write <url, desc> pairs to v[1] array
			URLInfoArray urlArr(downInfo, false);
			urlArr.asVariant(&v[1]);
			if (v[1].pparray)
			{
				// write empty Flash URL list to param array
				SAFEARRAY			*pSA_FLASH = NULL;
				SAFEARRAYBOUND		bound_flash[1];
				bound_flash[0].lLbound = 0;
				bound_flash[0].cElements = 0;
				pSA_FLASH = SafeArrayCreate(VT_VARIANT, 1, bound_flash);
				v[0].vt = VT_ARRAY | VT_BYREF | VT_VARIANT;
				v[0].pparray = &pSA_FLASH;

				invoke("AddLinkList", v, 5);
				SafeArrayDestroy(pSA_FLASH);
			}
			else
			{
				//SafeArray Create FAILED 
				return -1;
			}
		}

		return 0;
	}
};


//Download manager family like FlashGet
class DMAddUrlFamily : public DMSupportCOM
{
public:
	long dispatch(DownloadInfo & downInfo)
	{
		prepareCOMObj();

		// COM: void AddUrl(string url, string desc, string ref)
		if (downInfo.count == 1) {
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
			invoke("AddUrlList", &v, 1);
		}

		return 0;
	}
};

class DMFlashGet : public DMAddUrlFamily
{
protected:
	const char * getProgId() { return "JetCar.Netscape"; }

public:
	static const char * getName() { return "FlashGet"; }
};

class DMFlashGet19 : public DMFlashGet
{
protected:
	const char * getProgId() { return "FG2CatchUrl.Netscape"; }

public:
	static const char * getName() { return "FlashGet19"; }
};

class DMFlashGet3 : public DMSupportCOM
{
protected:
	const char * getProgId() { return "BHO.IFlashGetNetscapeEx"; }

public:
	static const char * getName() { return "FlashGet3"; }
	virtual const wchar_t * getModuleName() { return L"FlashGet3"; }

	long dispatch(DownloadInfo & downInfo)
	{
		try 
		{
			prepareCOMObj();
		} 
		catch (_com_error& e)
		{
			//Check older version
			DMFlashGet fg;
			DMFlashGet19 fg19;
			long result = 0;

			try
			{
				result = fg.dispatch(downInfo);
			}
			catch (_com_error& e)
			{
				result = fg19.dispatch(downInfo);
			}

			return result;
		}
		

		// COM: void AddUrlEx(string url, string text, string ref, string modulename, string cookies, string flag, int nFromStyle)
		if (downInfo.count == 1) {
			_variant_t v[7];
			v[6] = downInfo.urls[0];
			v[5] = downInfo.descs[0];
			v[4] = downInfo.referrer;
			v[3] = getModuleName();
			v[2] = downInfo.cookies[0];
			v[1] = L"0";
			v[0] = 3;
			invoke("AddUrlEx", v, 7);
		} 
		else if (downInfo.count > 1)
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
				v[1] = L"";
				v[0] = L"0";
				invoke("AddAll", v, 5);
			}
			else
			{
				//SafeArray Create FAILED 
				return -1;
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

	return new DMThunder(); //Thunder by default
}


//////////////////////////////////////////////////////////////////////////
//
// Call external downloader by COM
//
//////////////////////////////////////////////////////////////////////////
#ifdef NDEBUG
#pragma comment( linker, "/subsystem:\"windows\" /entry:\"mainCRTStartup\"" )
#endif

#define ARG_ERROR -100
#define COM_ERROR -99
#define INVOKE_ERROR -98
#define JOB_ERROR -97
#define MB_TITLE L"xThunder"

#define BUF_SIZE 16384
char g_buf[BUF_SIZE];
wchar_t g_wbuf[BUF_SIZE];

wchar_t * readLine(FILE *stream) 
{
	char *res; 
	res = fgets(g_buf,BUF_SIZE,stream);
	const char * src = (const char*) res;
	return src && (MultiByteToWideChar(CP_UTF8,0,src,-1,g_wbuf, BUF_SIZE) 
		|| MultiByteToWideChar(CP_ACP,0,src,-1,g_wbuf, BUF_SIZE))
		? g_wbuf : L"";
}

//////////////////////////////////////////////////////////////////////////
//
// File Format:
//				Directory
//				Referrer
//				url        \
//				cookie      - repeat n 
//				desc       /
//
//////////////////////////////////////////////////////////////////////////
int parseJob(DownloadInfo & downInfo, char * jobFilePath) {
	FILE *f;
	if(fopen_s(&f, jobFilePath, "rb") == 0) {
		downInfo.dir = readLine(f);
		downInfo.referrer = readLine(f);
		for (int i=0; i<downInfo.count; ++i)
		{
			downInfo.urls[i] = readLine(f);
			downInfo.cookies[i] = readLine(f);
			downInfo.descs[i] = readLine(f);
		}
		fclose(f);
	} else {
		MessageBox(NULL, L"Process job file failure.", MB_TITLE, MB_OK);
		return JOB_ERROR;
	}

	return 0;
}

int main(int argc, char* argv[])
{
	//-a agentName -p jobFilePath -n taskCount -s sleepSecond
	if(argc < 5)
	{
		MessageBox(NULL, L"The arguments of are wrong.", MB_TITLE, MB_OK);
		return ARG_ERROR;
	}

	char * agentName;
	char * jobFilePath;
	int count = 1;
	int sleepSec = 10;

	int i = 1;
	while(i<argc) {
		if (!strcmp("-a", argv[i]))
		{
			agentName = argv[++i];
		}
		else if (!strcmp("-p", argv[i]))
		{
			jobFilePath = argv[++i];
		}
		else if (!strcmp("-n", argv[i]))
		{
			count = atoi(argv[++i]);
		}
		else if (!strcmp("-s", argv[i]))
		{
			sleepSec = atoi(argv[++i]);
		}

		++i;
	}

	DMSupportCOM * dmAgent = NULL;
	int retVal = 0;
	try
	{
		DownloadInfo downInfo(count);
		retVal = parseJob(downInfo, jobFilePath);
		if (retVal >= 0)
		{
			dmAgent = DMSupportCOMFactory::Instance().getDMAgent(agentName);
			retVal = dmAgent->dispatch(downInfo);
		}
		remove(jobFilePath);
	}
	catch (_com_error& e)
	{
		sprintf_s(g_buf, BUF_SIZE, "Call %s error, please check if it was properly installed!", agentName);
		MultiByteToWideChar(CP_ACP,0,g_buf,-1,g_wbuf,BUF_SIZE);
		MessageBox(NULL, g_wbuf, MB_TITLE, MB_OK);
		retVal = COM_ERROR;
	}
	catch (...)
	{
		MessageBox(NULL, L"Invoke method failure.", MB_TITLE, MB_OK);
		retVal = INVOKE_ERROR;
	}

	if (dmAgent != NULL)
	{
		delete dmAgent;
	}

	//Sleep for a while in case of downloader's first start
	//This process should not be blocked by external call
	Sleep(1000 * sleepSec);	
	return retVal;
}