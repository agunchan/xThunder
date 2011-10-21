#include "mozilla/ModuleUtils.h"
#include "nsIClassInfoImpl.h"
#include "XThunderComponent.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(XThunderComponent)
NS_DEFINE_NAMED_CID(XThunderComponent_CID);


static const mozilla::Module::CIDEntry kXThunderComponentCIDs[] = {
	{ &kXThunderComponent_CID, false, NULL, XThunderComponentConstructor },
	{ NULL }
};

static const mozilla::Module::ContractIDEntry kXThunderComponentContracts[] = {
	{ XTHUNDERCOMPONENT_CONTRACTID, &kXThunderComponent_CID },
	{ NULL }
};

static const mozilla::Module kXThunderComponentModule = {
	mozilla::Module::kVersion,
	kXThunderComponentCIDs,
	kXThunderComponentContracts,
	NULL
};

NSMODULE_DEFN(XThunderComponentModule) = &kXThunderComponentModule;
NS_IMPL_MOZILLA192_NSGETMODULE(&kXThunderComponentModule)
