/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM IXThunderComponent.idl
 */

#ifndef __gen_IXThunderComponent_h__
#define __gen_IXThunderComponent_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    IXThunderComponent */
#define IXTHUNDERCOMPONENT_IID_STR "77683972-8cb9-4f92-a962-aea5b6f1e2a1"

#define IXTHUNDERCOMPONENT_IID \
  {0x77683972, 0x8cb9, 0x4f92, \
    { 0xa9, 0x62, 0xae, 0xa5, 0xb6, 0xf1, 0xe2, 0xa1 }}

class NS_NO_VTABLE NS_SCRIPTABLE IXThunderComponent : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(IXTHUNDERCOMPONENT_IID)

  /* long CallAgent (in string agentname, in unsigned long count, in wstring referrer, [array, size_is (count)] in wstring urls, [array, size_is (count)] in wstring cookies, [array, size_is (count)] in wstring descs); */
  NS_SCRIPTABLE NS_IMETHOD CallAgent(const char *agentname, PRUint32 count, const PRUnichar *referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(IXThunderComponent, IXTHUNDERCOMPONENT_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_IXTHUNDERCOMPONENT \
  NS_SCRIPTABLE NS_IMETHOD CallAgent(const char *agentname, PRUint32 count, const PRUnichar *referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_IXTHUNDERCOMPONENT(_to) \
  NS_SCRIPTABLE NS_IMETHOD CallAgent(const char *agentname, PRUint32 count, const PRUnichar *referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM) { return _to CallAgent(agentname, count, referrer, urls, cookies, descs, _retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_IXTHUNDERCOMPONENT(_to) \
  NS_SCRIPTABLE NS_IMETHOD CallAgent(const char *agentname, PRUint32 count, const PRUnichar *referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->CallAgent(agentname, count, referrer, urls, cookies, descs, _retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public IXThunderComponent
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_IXTHUNDERCOMPONENT

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, IXThunderComponent)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* long CallAgent (in string agentname, in unsigned long count, in wstring referrer, [array, size_is (count)] in wstring urls, [array, size_is (count)] in wstring cookies, [array, size_is (count)] in wstring descs); */
NS_IMETHODIMP _MYCLASS_::CallAgent(const char *agentname, PRUint32 count, const PRUnichar *referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_IXThunderComponent_h__ */
