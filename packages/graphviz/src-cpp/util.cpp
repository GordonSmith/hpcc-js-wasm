#include "util.hpp"

StringBuffer::operator std::string() const
{
    return m_buffer;
}

StringBuffer::operator const char *() const
{
    return m_buffer.c_str();
}

StringBuffer &StringBuffer::operator=(const std::string &str)
{
    m_buffer = str;
    return *this;
}

TempFileBuffer::TempFileBuffer()
{
    // For WASI, use open_memstream to create an in-memory file stream
    filePointer = open_memstream(&buffer, &bufferSize);
    if (filePointer == nullptr)
    {
        buffer = nullptr;
        bufferSize = 0;
    }
    tempFileName[0] = '\0';
}

TempFileBuffer::~TempFileBuffer()
{
    if (filePointer != nullptr)
    {
        std::fclose(filePointer);
        if (buffer != nullptr)
        {
            free(buffer);
        }
    }
}

TempFileBuffer::operator FILE *() const
{
    return filePointer;
}

TempFileBuffer::operator std::string() const
{
    std::string content;
    if (filePointer != nullptr && buffer != nullptr)
    {
        // Flush the stream to ensure all data is in the buffer
        std::fflush(filePointer);
        content = std::string(buffer, bufferSize);
    }
    return content;
}
