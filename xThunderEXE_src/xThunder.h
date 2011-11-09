#ifndef __XTHUNDER_H__
#define __XTHUNDER_H__

#include <sys/stat.h>
#include <comdef.h>
#include <atlbase.h>
#include <atlcom.h>
#include <objbase.h>
#include <time.h>
#include <string>

struct DownloadInfo 
{
	unsigned int count;
	_variant_t referrer;
	_variant_t * urls;
	_variant_t * descs;
	_variant_t * cookies;
	_variant_t * cids;

	DownloadInfo() : count(0), urls(NULL), descs(NULL), cookies(NULL), cids(NULL)
	{
		
	}

	void init(unsigned c) 
	{
		count = c;
		urls = new _variant_t[count];
		descs = new _variant_t[count];
		cookies = new _variant_t[count];
		cids = new _variant_t[count];
	}

	~DownloadInfo() 
	{
		if (urls) 
		{
			delete [] urls;
		}	
		if (descs) 
		{
			delete [] descs;
		}
		if (cookies) 
		{
			delete [] cookies;
		}
		if (cids) 
		{
			delete [] cids;
		}
	}
};



//////////////////////////////////////////////////////////////////////////
//
// Base class of download manager supporting COM
//
//////////////////////////////////////////////////////////////////////////
#define SAFEARRAY_FAILED -1
#define COMCALL(Call) if(hr=FAILED(Call)) throw _com_error(hr)
class DMSupportCOM 
{
private:
	CComDispatchDriver  comObj;
	CComPtr<IDispatch>  lpTDispatch;

protected:
	HRESULT hr;

	virtual const char * getProgId() = 0;

	void prepareCOMObj(char * progId = NULL)
	{
		USES_CONVERSION;
		COMCALL(lpTDispatch.CoCreateInstance(A2OLE(progId ? progId : getProgId())));
		comObj=lpTDispatch;
	}

	void invoke(char *memberName, VARIANT *parms, int parmsCount)
	{
		USES_CONVERSION;
		COMCALL(comObj.InvokeN(A2OLE(memberName),parms,parmsCount));
	}

	void set(char *propertyName, VARIANT *val) 
	{
		USES_CONVERSION;
		COMCALL(comObj.PutPropertyByName(A2COLE(propertyName), val));
	}

public:
	DMSupportCOM()
	{
		
	}

	virtual ~DMSupportCOM()
	{

	}

	virtual long dispatch(DownloadInfo & downInfo) = 0;
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