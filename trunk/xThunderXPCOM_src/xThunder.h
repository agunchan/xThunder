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
	const wchar_t * referrer;
	const wchar_t **urls;
	const wchar_t **cookies;
	const wchar_t **descs;

	DownloadInfo(unsigned int cnt, const wchar_t * r, const wchar_t ** u, const wchar_t ** c, const wchar_t **d) 
		: count(cnt), referrer(r), urls(u), cookies(c), descs(d) {}
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

	DMSupportCOM * getDMAgent(const char * agentname);
};

#endif