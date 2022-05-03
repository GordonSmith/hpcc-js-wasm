#pragma once

#include <vector>
#include <string>
#include <sstream>

class CBase91
{
private:
    char status[32];
    char *encbuf;
    size_t encbuf_size;
    char *decbuf;
    size_t decbuf_size;
    char *obuf;
    size_t llen;

public:
    CBase91();
    ~CBase91();

    std::string encode(const std::vector<uint8_t> &data);
    std::vector<uint8_t> decode(const std::string &str);

    void stream_b91enc_p(std::stringstream &in, std::stringstream &out);
    void stream_b91dec(std::stringstream &in, std::stringstream &out);
};
