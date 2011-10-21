#ifndef __XTHUNDERCOMPONENT_H__
#define __XTHUNDERCOMPONENT_H__

#include "IXThunderComponent.h"

#define XTHUNDERCOMPONENT_CONTRACTID "@lshai.com/xthundercomponent;1"
#define XThunderComponent_CID {0x77683972, 0x8cb9, 0x4f92, { 0xa9, 0x62, 0xae, 0xa5, 0xb6, 0xf1, 0xe2, 0xa1 }}

class XThunderComponent : public IXThunderComponent
{
public:
	NS_DECL_ISUPPORTS
	NS_DECL_IXTHUNDERCOMPONENT

	XThunderComponent();

private:
	~XThunderComponent();
};

#endif