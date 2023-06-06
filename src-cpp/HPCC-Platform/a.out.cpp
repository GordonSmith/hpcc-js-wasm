/* Template for generating thor/hthor/roxie output */
#if defined(__clang__) || (__GNUC__ > 4 || (__GNUC__ == 4 && __GNUC_MINOR__ >= 2))
#pragma GCC diagnostic ignored "-Wall"
#pragma GCC diagnostic ignored "-Wextra"
#endif
#include "eclinclude4.hpp"
#define NOOPTIMIZE
#define OPTIMIZE
#include "eclrtl.hpp"

namespace nlp { extern void AnalyzeText(ICodeContext * ctx,size32_t & __lenResult,char * & __result,size32_t lenAnalyzer,const char * analyzer,size32_t lenTxt,const char * txt); }

#include "a.out.hpp"




struct MyEclProcess : public EclProcess {
	virtual unsigned getActivityVersion() const override { return ACTIVITY_INTERFACE_VERSION; }
	virtual int perform(IGlobalCodeContext * gctx, unsigned wfid) override {
		ICodeContext * ctx;
		ctx = gctx->queryCodeContext();
		switch (wfid) {
			case 1U: {
				rtlDataAttr v1;
				unsigned v2;
				nlp::AnalyzeText(ctx,v2,v1.refstr(),11U,"parse-en-us",45U,"The quick brown fox jumped over the lazy boy.");
				ctx->setResultString(0,0U,v2,v1.getstr());
				rtlDataAttr v3;
				unsigned v4;
				nlp::AnalyzeText(ctx,v4,v3.refstr(),9U,"corporate",90U,"TAI has bought the American Medical Records Processing for more than $130 million dollars.");
				ctx->setResultString(0,1U,v4,v3.getstr());
				rtlDataAttr v5;
				unsigned v6;
				nlp::AnalyzeText(ctx,v6,v5.refstr(),11U,"parse-en-us",66U,"Right middle lobe consolidation compatible with acute pneumonitis.");
				ctx->setResultString(0,2U,v6,v5.getstr());
				rtlDataAttr v7;
				unsigned v8;
				nlp::AnalyzeText(ctx,v8,v7.refstr(),9U,"corporate",51U,"XXX's stock is up 4% from $58.33 a share to $60.66.");
				ctx->setResultString(0,3U,v8,v7.getstr());
			}
			break;
		}
		return 4U;
	}
};
int main(int argc, const char *argv[]) {
	return start_query(argc, argv);

}


extern "C" ECL_API IEclProcess* createProcess()
{

    return new MyEclProcess;
}


