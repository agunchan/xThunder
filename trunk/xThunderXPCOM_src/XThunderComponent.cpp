#include "XThunderComponent.h"
#include "xThunder.h"

NS_IMPL_ISUPPORTS1(XThunderComponent, IXThunderComponent)

XThunderComponent::XThunderComponent()
{
	/* member initializers and constructor code */
}

XThunderComponent::~XThunderComponent()
{
	/* destructor code */
}

NS_IMETHODIMP XThunderComponent::CallAgent(const char *agentname, PRUint32 count, const PRUnichar * referrer, const PRUnichar **urls, const PRUnichar **cookies, const PRUnichar **descs, PRInt32 *_retval NS_OUTPARAM)
{
	DMSupportCOM * dmAgent = NULL;

	try
	{
		dmAgent = DMSupportCOMFactory::Instance().getDMAgent(agentname);
		DownloadInfo downInfo(count, referrer, urls, cookies, descs);
		*_retval = dmAgent->dispatch(downInfo);
	}
	catch (_com_error& e)
	{
		*_retval = -1;
	}
	catch (...)
	{
		*_retval = -2;
	}

	if (dmAgent != NULL)
	{
		delete dmAgent;
	}
	
	return NS_OK;
}