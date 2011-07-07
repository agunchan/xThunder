#ifndef __XTHUNDER_H__
#define __XTHUNDER_H__

#include <sys/stat.h>
#include <comdef.h>
#include <atlbase.h>
#include <atlcom.h>
#include <objbase.h>
#include <wininet.h>
#include <time.h>
#include <string>
#include <stdio.h>
#include <wchar.h>

struct DownloadInfo 
{
	unsigned int count;
	_variant_t dir;
	_variant_t referrer;
	_variant_t * urls;
	_variant_t * cookies;
	_variant_t * descs;

	DownloadInfo(unsigned int c) : count(c){
		urls = new _variant_t[count];
		cookies = new _variant_t[count];
		descs = new _variant_t[count];
	}

	~DownloadInfo() 
	{
		if (urls) 
		{
			delete [] urls;
		}	
		if (cookies) 
		{
			delete [] cookies;
		}
		if (descs) 
		{
			delete [] descs;
		}
	}
};



//////////////////////////////////////////////////////////////////////////
//
// Base class of download manager supporting COM
//
//////////////////////////////////////////////////////////////////////////
#define COMCALL(Call) if(hr=FAILED(Call)) throw _com_error(hr)
class DMSupportCOM 
{
private:
	CComDispatchDriver  comObj;
	CComPtr<IDispatch>  lpTDispatch;

protected:
	HRESULT hr;

	virtual const char * getProgId() = 0;

	void prepareCOMObj(char * progId = NULL) {
		USES_CONVERSION;
		COMCALL(lpTDispatch.CoCreateInstance(A2OLE(progId ? progId : getProgId())));
		comObj=lpTDispatch;
	}

	void invoke(char *memberName, VARIANT *parms, int parmsCount) {
		USES_CONVERSION;
		COMCALL(comObj.InvokeN(A2OLE(memberName),parms,parmsCount));
	}

public:
	DMSupportCOM() {
		
	}

	virtual ~DMSupportCOM() {

	}

	virtual long dispatch(DownloadInfo & downInfo) = 0;

	static const char * getName() {	return "DMSupportCOM"; }
};


//////////////////////////////////////////////////////////////////////////
//
// DMSupportCOM Factory : Get download manager by agent name
//
//////////////////////////////////////////////////////////////////////////
class DMSupportCOMFactory
{
public:
	static DMSupportCOMFactory& Instance() 
	{
		static DMSupportCOMFactory instance;
		return instance;
	}

	DMSupportCOMFactory() 
	{
		CoInitialize(NULL);
	}

	~DMSupportCOMFactory() 
	{
		CoUninitialize();
	}

	DMSupportCOM * getDMAgent(const char * agentname);
};

#endif