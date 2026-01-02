// Base91 reference: http://base91.sourceforge.net/

// The 91-character alphabet.
const TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~\"";

let g_heapBase: usize = 0;
let g_heap: usize = 0;
let g_lastLen: usize = 0;

@inline
function align8(x: usize): usize {
    return (x + 7) & ~7;
}

// Optimized decode lookup - searches the TABLE string instead of using a 256-entry array
@inline
function decodeChar(ch: u8): i32 {
    for (let i = 0; i < 91; i++) {
        if (TABLE.charCodeAt(i) == ch) return i;
    }
    return -1;
}

export function heap_reset(): void {
    if (g_heapBase == 0) {
        // Use the end of the initial memory as a conservative heap base.
        g_heapBase = align8((<usize>memory.size()) << 16);
    }
    g_heap = g_heapBase;
    g_lastLen = 0;
}

export function malloc(size: usize): usize {
    if (g_heap == 0) heap_reset();

    const ptr = g_heap;
    g_heap = align8(ptr + size);

    const neededPages = (g_heap + 0xffff) >>> 16;
    const currentPages = <usize>memory.size();
    if (neededPages > currentPages) {
        memory.grow(<i32>(neededPages - currentPages));
    }

    return ptr;
}

export function encode_len(): usize {
    return g_lastLen;
}

export function decode_len(): usize {
    return g_lastLen;
}

export function encode(ptr: usize, len: usize): usize {
    const outPtr = malloc(len + ((len + 3) >>> 2) + 2);
    let outIdx: usize = 0;
    let b: u32 = 0;
    let n: u32 = 0;

    for (let i: usize = 0; i < len; i++) {
        b |= (<u32>load<u8>(ptr + i)) << n;
        n += 8;

        if (n > 13) {
            let v = b & 8191;
            let shift: u32;
            if (v > 88) {
                shift = 13;
            } else {
                v = b & 16383;
                shift = 14;
            }
            b >>= shift;
            n -= shift;
            const q = v / 91;
            store<u8>(outPtr + outIdx++, <u8>TABLE.charCodeAt(<i32>(v - q * 91)));
            store<u8>(outPtr + outIdx++, <u8>TABLE.charCodeAt(<i32>q));
        }
    }

    if (n > 0) {
        const q = b / 91;
        store<u8>(outPtr + outIdx++, <u8>TABLE.charCodeAt(<i32>(b - q * 91)));
        if (n > 7 || b > 90) {
            store<u8>(outPtr + outIdx++, <u8>TABLE.charCodeAt(<i32>q));
        }
    }

    g_lastLen = outIdx;
    return outPtr;
}

export function decode(ptr: usize, len: usize): usize {
    const outPtr = malloc(len);
    let outIdx: usize = 0;

    let b: u32 = 0;
    let n: u32 = 0;
    let v: i32 = -1;

    for (let i: usize = 0; i < len; i++) {
        const ch = load<u8>(ptr + i);
        const p = decodeChar(ch);
        if (p < 0) continue;
        if (v < 0) {
            v = p;
        } else {
            v += p * 91;
            b |= (<u32>v) << n;
            n += ((v & 8191) > 88) ? 13 : 14;
            do {
                store<u8>(outPtr + outIdx++, <u8>(b & 0xff));
                b >>= 8;
                n -= 8;
            } while (n > 7);
            v = -1;
        }
    }

    if (v > -1) {
        store<u8>(outPtr + outIdx++, <u8>((b | (<u32>v) << n) & 0xff));
    }

    g_lastLen = outIdx;
    return outPtr;
}
