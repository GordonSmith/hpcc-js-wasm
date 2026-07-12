package org.hpccsystems.wasm.base91;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link Base91}.
 *
 * <p>The tests mirror the behaviour validated by the TypeScript test suite so
 * that parity between language bindings can be confirmed.
 */
class Base91Test {

    private Base91 base91;

    @BeforeEach
    void setUp() throws Exception {
        base91 = Base91.load();
    }

    @AfterEach
    void tearDown() {
        if (base91 != null) {
            base91.close();
        }
    }

    @Test
    void version_returnsExpectedString() {
        String v = base91.version();
        assertNotNull(v);
        assertFalse(v.isBlank(), "version string should not be blank");
        assertEquals("0.6.0", v, "version should match the bundled library version");
    }

    @Test
    void encode_thenDecode_roundTrips() {
        byte[] data = new byte[1000];
        for (int i = 0; i < data.length; i++) {
            data[i] = (byte) (i % 256);
        }

        String encoded = base91.encode(data);
        assertNotNull(encoded);
        assertFalse(encoded.isEmpty(), "encoded string should not be empty");

        byte[] decoded = base91.decode(encoded);
        assertArrayEquals(data, decoded, "decoded data should match original");
    }

    @Test
    void encode_emptyArray_returnsEmptyString() {
        String encoded = base91.encode(new byte[0]);
        // Base91 of empty input should be empty
        assertEquals("", encoded);
    }

    @Test
    void decode_emptyString_returnsEmptyArray() {
        byte[] decoded = base91.decode("");
        assertEquals(0, decoded.length);
    }

    @Test
    void encode_singleByte_isReversible() {
        byte[] data = {0x42};
        String encoded = base91.encode(data);
        byte[] decoded = base91.decode(encoded);
        assertArrayEquals(data, decoded);
    }

    @Test
    void encode_isMoreCompactThanBase64() {
        // 1 000 bytes of repeating data
        byte[] data = new byte[1000];
        Arrays.fill(data, (byte) 0xAB);

        String base91Str = base91.encode(data);

        // Base64 size = ceil(1000/3)*4 = 1336 chars
        // Base91 should be shorter
        assertTrue(base91Str.length() < 1336,
            "Base91 encoded size (" + base91Str.length() + ") should be less than Base64 (1336)");
    }

    @Test
    void encode_textBytes_roundTrips() {
        String text = "Hello, World! This is a Base91 round-trip test.";
        byte[] data = text.getBytes(StandardCharsets.UTF_8);

        String encoded = base91.encode(data);
        byte[] decoded = base91.decode(encoded);

        assertEquals(text, new String(decoded, StandardCharsets.UTF_8));
    }

    @Test
    void encode_largePayload_roundTrips() {
        // 64 KB of pseudo-random data
        byte[] data = new byte[65536];
        for (int i = 0; i < data.length; i++) {
            data[i] = (byte) ((i * 17 + 31) % 256);
        }

        String encoded = base91.encode(data);
        byte[] decoded = base91.decode(encoded);
        assertArrayEquals(data, decoded, "large payload should round-trip correctly");
    }

    @Test
    void closedInstance_throwsOnUse() {
        base91.close();
        assertThrows(IllegalStateException.class, () -> base91.version());
        assertThrows(IllegalStateException.class, () -> base91.encode(new byte[]{1}));
        assertThrows(IllegalStateException.class, () -> base91.decode("AA"));
    }

    @Test
    void load_canBeCalledMultipleTimes_returnsIndependentInstances() throws Exception {
        try (Base91 second = Base91.load()) {
            assertNotSame(base91, second);

            byte[] data = "independent instances test".getBytes(StandardCharsets.UTF_8);
            assertEquals(base91.encode(data), second.encode(data),
                "Both instances should produce identical encoded output");
        }
    }

    @Test
    void nullData_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> base91.encode(null));
        assertThrows(IllegalArgumentException.class, () -> base91.decode(null));
    }
}
