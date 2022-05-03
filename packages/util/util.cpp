#include "util.hpp"

Buffer::Buffer()
{
}

Buffer::Buffer(const std::vector<unsigned char> &compressed_data) : m_compressed_data(compressed_data)
{
}

Buffer::Buffer(const Buffer &b)
{
    m_compressed_data = b.m_compressed_data;
}

Buffer::~Buffer()
{
}

void *Buffer::data() const
{
    return (void *)&m_compressed_data[0];
}

std::size_t Buffer::length() const
{
    return m_compressed_data.size();
}
