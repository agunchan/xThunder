#include "xThunder.h"


//////////////////////////////////////////////////////////////////////////
//
// Call external downloader by COM
// Version : 1.1.3
// Creator : agunchan
// License : MPL 1.1
//
//////////////////////////////////////////////////////////////////////////
#ifdef NDEBUG
#pragma comment( linker, "/subsystem:\"windows\" /entry:\"mainCRTStartup\"" )
#endif

enum callError { ARG_ERROR = -100, COM_ERROR, INVOKE_ERROR, JOB_ERROR};
#define MB_TITLE L"xThunder"
#define BUF_SIZE 16384
#define SPACE_ASCII 32
char g_buf[BUF_SIZE];
wchar_t g_wbuf[BUF_SIZE];

wchar_t * readLine(FILE *stream) 
{
	char *res; 
	res = fgets(g_buf,BUF_SIZE,stream);
	res[strlen(res)-1] = '\0'; //get rid of \n 

	const char * src = (const char*) res;
	return src && (MultiByteToWideChar(CP_UTF8,0,src,-1,g_wbuf, BUF_SIZE) 
		|| MultiByteToWideChar(CP_ACP,0,src,-1,g_wbuf, BUF_SIZE))
		? g_wbuf : L"";
}

//////////////////////////////////////////////////////////////////////////
//
// File Format:
//				Referrer
//				url       -
//				desc       \  repeat n 
//				cookie     /
//				cid		  -
//
//////////////////////////////////////////////////////////////////////////
int parseJob(DownloadInfo & downInfo, char * jobFilePath)
{
	FILE *f;
	if(fopen_s(&f, jobFilePath, "rb") == 0) 
	{
		downInfo.init(_wtoi(readLine(f)));
		downInfo.referrer = readLine(f);
		for (int i=0; i<downInfo.count; ++i)
		{
			downInfo.urls[i] = readLine(f);
			downInfo.descs[i] = readLine(f);
			downInfo.cookies[i] = readLine(f);
			downInfo.cids[i] = readLine(f);
		}
		fclose(f);
	} 
	else 
	{
		MessageBox(NULL, L"Cannot open job file.", MB_TITLE, MB_OK);
		return JOB_ERROR;
	}

	return 0;
}

int main(int argc, char* argv[])
{
	//-a agentName -f jobFilePath -s sleepSecond
	if(argc < 5)
	{
		MessageBox(NULL, L"Wrong number of arguments.\n -a agentName(*)\n -f taskCount jobFilePath\n -s sleepSec\n", MB_TITLE, MB_OK);
		return ARG_ERROR;
	}

	char * agentName = NULL;
	char * jobFilePath = NULL;
	int count = 1;
	int sleepSec = 15;
	DownloadInfo downInfo;
	int retVal = 0;

	int i = 1;
	while(i<argc)
	{
		if (!strcmp("-a", argv[i]))
		{
			agentName = argv[++i];
		}
		else if (!strcmp("-f", argv[i]))
		{
			jobFilePath = argv[++i];
			retVal = parseJob(downInfo, jobFilePath);
			if (retVal < 0)
			{
				return retVal;
			}
		}
		else if (!strcmp("-d", argv[i]))
		{
			downInfo.init(1);
			downInfo.urls[0] = argv[++i];
			downInfo.referrer = argv[++i][0] == SPACE_ASCII ? "" : argv[i];
			downInfo.descs[0] = argv[++i][0] == SPACE_ASCII ? "" : argv[i];
			downInfo.cookies[0] = argv[++i][0] == SPACE_ASCII ? "" : argv[i];
			downInfo.cids[0] = argv[++i][0] == SPACE_ASCII ? "" : argv[i];
		}
		else if (!strcmp("-s", argv[i]))
		{
			sleepSec = atoi(argv[++i]);
		}

		++i;
	}

	DMSupportCOM * dmAgent = NULL;
	try
	{
		dmAgent = DMSupportCOMFactory::Instance().getDMAgent(agentName);
		if (dmAgent)
		{
			retVal = dmAgent->dispatch(downInfo);
		}
#ifdef NDEBUG
		if (jobFilePath != NULL)
		{
			remove(jobFilePath);
		}
#endif
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