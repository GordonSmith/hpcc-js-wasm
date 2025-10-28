#include <unistd.h> // for getpid
#include "stack_parser.h"
#include <string>
#include <expat.h>
#include "root.h"

class CExpat : public CExpatImpl<CExpat>
{
private:
    typedef CExpatImpl<CExpat> BaseClass;

protected:
    exports_hpcc_js_expat_resources_borrow_callback_t m_cb;
    std::string m_tag;
    std::string m_attrs;
    std::string m_content;

public:
    static const char *version()
    {
        return XML_ExpatVersion();
    }

    CExpat(exports_hpcc_js_expat_resources_borrow_callback_t cb) : m_cb(cb)
    {
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

    bool parse(const char *xml, int len)
    {
        return BaseClass::Parse(xml, len, XML_TRUE);
    }

    const char *tag() const
    {
        return m_tag.c_str();
    }

    const char *attrs() const
    {
        return m_attrs.c_str();
    }

    const char *content() const
    {
        return m_content.c_str();
    }

    virtual void startElement()
    {
        root_string_t tag_str;
        root_string_dup(&tag_str, m_tag.c_str());
        root_string_t attrs_str;
        root_string_dup(&attrs_str, m_attrs.c_str());
        hpcc_js_expat_types_method_callback_start_element(m_cb, &tag_str, &attrs_str);
        root_string_free(&tag_str);
        root_string_free(&attrs_str);
    }
    virtual void endElement()
    {
        root_string_t tag_str;
        root_string_dup(&tag_str, m_tag.c_str());
        hpcc_js_expat_types_method_callback_end_element(m_cb, &tag_str);
        root_string_free(&tag_str);
    }
    virtual void characterData()
    {
        root_string_t content_str;
        root_string_dup(&content_str, m_content.c_str());
        hpcc_js_expat_types_method_callback_character_data(m_cb, &content_str);
        root_string_free(&content_str);
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

exports_hpcc_js_expat_resources_own_expat_t exports_hpcc_js_expat_resources_constructor_expat(exports_hpcc_js_expat_resources_borrow_callback_t cb)
{
    CExpat *instance = new CExpat(cb);
    return exports_hpcc_js_expat_resources_expat_new((exports_hpcc_js_expat_resources_expat_t *)instance);
}
void exports_hpcc_js_expat_resources_expat_destructor(exports_hpcc_js_expat_resources_expat_t *rep)
{
    CExpat *instance = (CExpat *)rep;
    delete instance;
}
void exports_hpcc_js_expat_resources_method_expat_version(exports_hpcc_js_expat_resources_borrow_expat_t self, root_string_t *ret)
{
    CExpat *instance = (CExpat *)self;
    root_string_dup(ret, instance->version());
}
bool exports_hpcc_js_expat_resources_method_expat_create(exports_hpcc_js_expat_resources_borrow_expat_t self)
{
    CExpat *instance = (CExpat *)self;
    return instance->create();
}
void exports_hpcc_js_expat_resources_method_expat_destroy(exports_hpcc_js_expat_resources_borrow_expat_t self)
{
    CExpat *instance = (CExpat *)self;
    instance->destroy();
}
bool exports_hpcc_js_expat_resources_method_expat_parse(exports_hpcc_js_expat_resources_borrow_expat_t self, root_string_t *xml)
{
    CExpat *instance = (CExpat *)self;
    return instance->parse((const char *)xml->ptr, xml->len);
}
void exports_hpcc_js_expat_resources_method_expat_tag(exports_hpcc_js_expat_resources_borrow_expat_t self, root_string_t *ret)
{
    CExpat *instance = (CExpat *)self;
    root_string_dup(ret, instance->tag());
}
void exports_hpcc_js_expat_resources_method_expat_attrs(exports_hpcc_js_expat_resources_borrow_expat_t self, root_string_t *ret)
{
    CExpat *instance = (CExpat *)self;
    root_string_dup(ret, instance->attrs());
}
void exports_hpcc_js_expat_resources_method_expat_content(exports_hpcc_js_expat_resources_borrow_expat_t self, root_string_t *ret)
{
    CExpat *instance = (CExpat *)self;
    root_string_dup(ret, instance->content());
}
void exports_hpcc_js_expat_resources_method_expat_start_element(exports_hpcc_js_expat_resources_borrow_expat_t self)
{
    CExpat *instance = (CExpat *)self;
    instance->startElement();
}
void exports_hpcc_js_expat_resources_method_expat_end_element(exports_hpcc_js_expat_resources_borrow_expat_t self)
{
    CExpat *instance = (CExpat *)self;
    instance->endElement();
}
void exports_hpcc_js_expat_resources_method_expat_character_data(exports_hpcc_js_expat_resources_borrow_expat_t self)
{
    CExpat *instance = (CExpat *)self;
    instance->characterData();
}