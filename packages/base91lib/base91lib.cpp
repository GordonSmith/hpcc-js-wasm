#include "base91lib.hpp"
#include <base91.hpp>
#include <util.hpp>

size_t buf_size = 65536;

CBase91::CBase91()
{
    encbuf_size = (buf_size - 2) << 4;
    encbuf_size /= 29;
    encbuf = reinterpret_cast<char *>(malloc(encbuf_size));
    decbuf_size = (buf_size - 1) << 3;
    decbuf_size /= 15;
    decbuf = reinterpret_cast<char *>(malloc(encbuf_size));
    obuf = reinterpret_cast<char *>(malloc(buf_size));
}

CBase91::~CBase91()
{
    free(decbuf);
    free(encbuf);
}

std::string CBase91::encode(const std::vector<uint8_t> &data)
{
    struct basE91 b91;
    basE91_init(&b91);
    char *buff = (char *)malloc(data.size() * 2);

    size_t s = basE91_encode(&b91, data.data(), data.size(), buff);
    std::string retVal(buff, buff + s);
    s = basE91_encode_end(&b91, buff);
    retVal.insert(retVal.end(), buff, buff + s);

    free(buff);
    return retVal;
}

void CBase91::stream_encode(std::istream &in, std::stringstream &out)
{
    struct basE91 b91;
    basE91_init(&b91);

    size_t itotal = 0;
    size_t ototal = 0;
    size_t s;

    while (in.good())
    {
        in.read(encbuf, encbuf_size);
        llen = in.gcount();
        itotal += llen;
        if (llen > 0)
        {
            s = basE91_encode(&b91, encbuf, llen, obuf);
            out.write(obuf, s);
            ototal += s;
        }
    }
    s = basE91_encode_end(&b91, obuf); /* empty bit queue */
    ototal += s;
    out.write(obuf, s);
    sprintf(status, "\t%.2f%%\n", itotal ? (float)ototal / itotal * 100.0 : 1.0);
}

std::vector<uint8_t> CBase91::decode(const std::string &str)
{
    struct basE91 b91;
    basE91_init(&b91);
    uint8_t *buff = (uint8_t *)malloc(str.size());

    size_t s = basE91_decode(&b91, str.c_str(), str.size(), buff);
    std::vector<uint8_t> retVal(buff, buff + s);
    s = basE91_decode_end(&b91, buff); /* empty bit queue */
    retVal.insert(retVal.end(), buff, buff + s);
    free(buff);
    return retVal;
}

void CBase91::stream_decode(std::stringstream &in, std::ostream &out)
{
    struct basE91 b91;
    basE91_init(&b91);
    size_t itotal = 0;
    size_t ototal = 0;
    size_t s;
    while (in.good())
    {
        in.read(decbuf, decbuf_size);
        llen = in.gcount();
        itotal += llen;
        if (llen > 0)
        {
            s = basE91_decode(&b91, decbuf, llen, obuf);
            out.write(obuf, s);
            ototal += s;
        }
    }
    s = basE91_decode_end(&b91, obuf); /* empty bit queue */
    ototal += s;
    out.write(obuf, s);
    sprintf(status, "\t%.2f%%\n", itotal ? (float)ototal / itotal * 100.0 : 1.0);
}