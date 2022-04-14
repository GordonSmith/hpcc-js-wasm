#include <vector>

class Buffer
{
protected:
    std::vector<unsigned char> m_compressed_data;

public:
    Buffer();
    Buffer(const std::vector<unsigned char> &compressed_data);
    Buffer(const Buffer &b);

    virtual ~Buffer();

    void *data() const;
    std::size_t length() const;

    // Base91
    void fromBase91(const char *str);
    const char *toBase91() const;
};
