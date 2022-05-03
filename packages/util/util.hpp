#ifndef UTIL_HPP_HEADER
#define UTIL_HPP_HEADER

#include <vector>

class Buffer
{
protected:
    std::vector<uint8_t> m_compressed_data;

public:
    Buffer();
    Buffer(const std::vector<uint8_t> &compressed_data);
    Buffer(const Buffer &b);

    virtual ~Buffer();

    void *data() const;
    std::size_t length() const;
};

#endif // UTIL_HPP_HEADER