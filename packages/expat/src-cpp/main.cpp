#include "stack_parser.h"

#include <string>
#include <expat.h>

#include <emscripten/val.h>
#include <emscripten/bind.h>

class CExpatParser : public CExpatImpl<CExpatParser>
{
private:
    typedef CExpatImpl<CExpatParser> BaseClass;

protected:
    std::string m_tag;
    std::string m_attrs;
    std::string m_content;
    emscripten::val m_callback = emscripten::val::undefined();

public:
    CExpatParser()
    {
    }

    void setCallback(emscripten::val callback)
    {
        m_callback = callback;
    }

    void OnPostCreate()
    {
        EnableStartElementHandler();
        EnableEndElementHandler();
        EnableCharacterDataHandler();
    }

    bool create()
    {
        return BaseClass::Create();
    }

    void destroy()
    {
        BaseClass::Destroy();
    }

    bool parse(const std::string &xml)
    {
        return BaseClass::Parse(xml.c_str(), (int)xml.size(), XML_TRUE);
    }

    virtual void startElement()
    {
        if (!m_callback.isUndefined() && !m_callback["startElement"].isUndefined())
        {
            m_callback.call<void>("startElement", m_tag, m_attrs);
        }
    }

    virtual void endElement()
    {
        if (!m_callback.isUndefined() && !m_callback["endElement"].isUndefined())
        {
            m_callback.call<void>("endElement", m_tag);
        }
    }

    virtual void characterData()
    {
        if (!m_callback.isUndefined() && !m_callback["characterData"].isUndefined())
        {
            m_callback.call<void>("characterData", m_content);
        }
    }

    virtual void OnStartElement(const XML_Char *pszName, const XML_Char **papszAttrs)
    {
        m_tag = pszName;
        m_attrs = "";
        for (XML_Char **itr = (XML_Char **)papszAttrs; *itr != NULL; itr += 2)
        {
            if (!m_attrs.empty())
            {
                m_attrs += "\1\1";
            }
            m_attrs += *itr;
            m_attrs += "\1";
            m_attrs += *(itr + 1);
        }
        startElement();
    }

    virtual void OnEndElement(const XML_Char *pszName)
    {
        m_tag = pszName;
        endElement();
    }

    virtual void OnCharacterData(const XML_Char *pszData, int nLength)
    {
        m_content.assign(pszData, nLength);
        characterData();
    }
};

class CExpat
{
public:
    static std::string version()
    {
        return XML_ExpatVersion();
    }

    bool parse(const std::string &xml, emscripten::val callback)
    {
        CExpatParser parser;
        parser.setCallback(callback);
        parser.create();
        auto retVal = parser.parse(xml);
        parser.destroy();
        return retVal;
    }
};

EMSCRIPTEN_BINDINGS(expatlib_bindings)
{
    emscripten::class_<CExpat>("CExpat")
        .constructor<>()
        .class_function("version", &CExpat::version)
        .function("parse", &CExpat::parse)

        ;
}
