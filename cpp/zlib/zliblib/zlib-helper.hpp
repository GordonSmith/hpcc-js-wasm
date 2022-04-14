#pragma once
#include <vector>

void compress_memory(void *in_data, size_t in_data_size, std::vector<unsigned char> &out_data);
void decompress_memory(void *in_data, size_t in_data_size, std::vector<unsigned char> &out_data);
