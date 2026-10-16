import struct
from app.utils.errors import (
    InvalidSignatureError,
    TruncatedJpegError,
    MalformedStructureError,
    ImageTooLargeError,
)

# Marker constants
SOI = 0xD8    # Start of Image (0xFFD8)
EOI = 0xD9    # End of Image (0xFFD9)
SOS = 0xDA    # Start of Scan (0xFFDA)
DQT = 0xDB    # Quantization Table (0xFFDB)
DHT = 0xC4    # Huffman Table (0xFFC4)
DRI = 0xDD    # Restart Interval (0xFFDD)
COM = 0xFE    # Comment (0xFFFE)

# SOF Markers (Start of Frame)
SOF_MARKERS = {
    0xC0: "SOF0 (Baseline)",
    0xC1: "SOF1 (Extended Sequential)",
    0xC2: "SOF2 (Progressive)",
    0xC3: "SOF3 (Lossless Sequential)",
    0xC5: "SOF5 (Differential Sequential)",
    0xC6: "SOF6 (Differential Progressive)",
    0xC7: "SOF7 (Differential Lossless)",
    0xC9: "SOF9 (Extended Sequential, Arithmetic)",
    0xCA: "SOF10 (Progressive, Arithmetic)",
    0xCB: "SOF11 (Lossless, Arithmetic)",
    0xCD: "SOF13 (Differential Sequential, Arithmetic)",
    0xCE: "SOF14 (Differential Progressive, Arithmetic)",
    0xCF: "SOF15 (Differential Lossless, Arithmetic)",
}

# Standalone markers with no length payload
STANDALONE_MARKERS = {
    0xD8,  # SOI
    0xD9,  # EOI
    0x01,  # TEM
    0x00,  # Byte stuffing
    0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7,  # RST0 - RST7
}


def parse_header_dimensions(data: bytes) -> dict:
    """
    Parse SOF marker directly to extract width, height, and megapixels
    without decompressing image pixels per PRD FR-UP-07.
    """
    if len(data) < 4 or data[:2] != b"\xFF\xD8":
        raise InvalidSignatureError("Not a valid JPEG image.")

    offset = 2
    data_len = len(data)

    while offset < data_len:
        # Seek next marker
        while offset < data_len and data[offset] != 0xFF:
            offset += 1

        while offset < data_len and data[offset] == 0xFF:
            offset += 1

        if offset >= data_len:
            break

        marker = data[offset]
        offset += 1

        if marker in STANDALONE_MARKERS:
            continue

        if offset + 2 > data_len:
            raise TruncatedJpegError("Truncated JPEG segment length.")

        (segment_len,) = struct.unpack(">H", data[offset : offset + 2])
        if segment_len < 2:
            raise MalformedStructureError(f"Invalid segment length {segment_len} at {offset}.")

        payload_start = offset + 2
        payload_end = offset + segment_len

        if payload_end > data_len:
            raise TruncatedJpegError("Segment length exceeds file size.")

        # Found SOF marker
        if marker in SOF_MARKERS:
            if segment_len < 8:
                raise MalformedStructureError("SOF segment too short for dimension headers.")

            precision = data[payload_start]
            height, width, components = struct.unpack(">HHB", data[payload_start + 1 : payload_start + 6])

            if width <= 0 or height <= 0:
                raise MalformedStructureError("Image dimensions must be positive integers.")

            pixels = width * height
            megapixels = round(pixels / 1_000_000.0, 2)

            if pixels > 50_000_000:
                raise ImageTooLargeError(
                    f"Image resolution {width}x{height} ({megapixels} MP) exceeds 50 MP limit."
                )

            return {
                "width": width,
                "height": height,
                "megapixels": megapixels,
                "precision": precision,
                "components": components,
                "type": SOF_MARKERS[marker],
            }

        # If SOS reached without seeing SOF, something is wrong
        if marker == SOS:
            break

        offset = payload_end

    raise MalformedStructureError("No valid SOF marker found in JPEG stream.")


def scan_segments(data: bytes) -> tuple[list[dict], dict]:
    """
    Full JPEG segment marker scanner per PRD FR-UP-09 and FR-META-01.
    Parses SOI -> markers -> SOS -> entropy data -> EOI.
    Returns (segments_list, image_info).
    """
    data_len = len(data)
    if data_len < 4 or data[0] != 0xFF or data[1] != 0xD8:
        raise InvalidSignatureError("First 2 bytes must equal FF D8.")

    if data[2] != 0xFF:
        raise InvalidSignatureError("Third byte must be marker prefix FF.")

    segments = []
    image_info = {
        "width": None,
        "height": None,
        "megapixels": None,
        "format": "JPEG",
        "has_exif": False,
        "has_xmp": False,
        "has_iptc": False,
        "has_icc": False,
        "has_com": False,
        "eoi_offset": None,
    }

    offset = 2

    while offset < data_len:
        # Seek next marker 0xFF
        while offset < data_len and data[offset] != 0xFF:
            offset += 1

        # Skip fill bytes
        while offset < data_len and data[offset] == 0xFF:
            offset += 1

        if offset >= data_len:
            break

        marker_byte = data[offset]
        marker_offset = offset - 1  # start of 0xFF
        offset += 1

        # Check for EOI
        if marker_byte == EOI:
            image_info["eoi_offset"] = offset
            break

        # Standalone markers without length
        if marker_byte in STANDALONE_MARKERS:
            continue

        # Markers with 2-byte length
        if offset + 2 > data_len:
            raise TruncatedJpegError("JPEG truncated before segment length could be read.")

        (segment_len,) = struct.unpack(">H", data[offset : offset + 2])
        if segment_len < 2:
            raise MalformedStructureError(f"Invalid segment length {segment_len} at offset {offset}.")

        payload_start = offset + 2
        payload_end = offset + segment_len

        if payload_end > data_len:
            raise TruncatedJpegError(f"Segment length {segment_len} exceeds file size.")

        payload = data[payload_start:payload_end]

        # SOF parsing
        if marker_byte in SOF_MARKERS and image_info["width"] is None:
            if segment_len >= 8:
                precision = payload[0]
                height, width, components = struct.unpack(">HHB", payload[1:6])
                if width <= 0 or height <= 0:
                    raise MalformedStructureError("Invalid image dimensions in SOF header.")

                pixels = width * height
                megapixels = round(pixels / 1_000_000.0, 2)
                if pixels > 50_000_000:
                    raise ImageTooLargeError(
                        f"Image resolution {width}x{height} ({megapixels} MP) exceeds 50 MP limit."
                    )

                image_info["width"] = width
                image_info["height"] = height
                image_info["megapixels"] = megapixels
                image_info["precision"] = precision
                image_info["components"] = components

        # Classify APPn and COM markers for the metadata segments report
        if 0xE0 <= marker_byte <= 0xEF or marker_byte == COM:
            marker_hex = f"APP{marker_byte - 0xE0}" if marker_byte != COM else "COM"
            name = marker_hex
            removable = True

            if marker_byte == 0xE0:  # APP0
                if payload.startswith(b"JFIF\x00"):
                    name = "JFIF"
                    removable = False
                elif payload.startswith(b"JFXX\x00"):
                    name = "JFXX"
                    removable = False
                else:
                    name = "APP0"
                    removable = False

            elif marker_byte == 0xE1:  # APP1
                if payload.startswith(b"Exif\x00\x00"):
                    name = "EXIF"
                    removable = True
                    image_info["has_exif"] = True
                elif payload.startswith(b"http://ns.adobe.com/xap/1.0/") or payload.startswith(b"http://ns.adobe.com/xmp/"):
                    name = "XMP"
                    removable = True
                    image_info["has_xmp"] = True
                else:
                    name = "APP1"
                    removable = True

            elif marker_byte == 0xE2:  # APP2
                if payload.startswith(b"ICC_PROFILE\x00"):
                    name = "ICC_PROFILE"
                    removable = False
                    image_info["has_icc"] = True
                elif payload.startswith(b"MPF\x00"):
                    name = "MPF"
                    removable = True
                elif payload.startswith(b"FPXR\x00"):
                    name = "FPXR"
                    removable = True
                else:
                    name = "APP2"
                    removable = True

            elif marker_byte == 0xED:  # APP13
                name = "IPTC"
                removable = True
                image_info["has_iptc"] = True

            elif marker_byte == 0xEE:  # APP14
                name = "Adobe"
                removable = False

            elif marker_byte == COM:
                name = "Comment"
                removable = True
                image_info["has_com"] = True

            segments.append({
                "marker": marker_hex,
                "name": name,
                "offset": marker_offset,
                "length": segment_len,
                "removable": removable,
            })

        # SOS - Start of Scan
        if marker_byte == SOS:
            # Advance past SOS segment header
            offset = payload_end
            # In entropy data, search for EOI (0xFFD9), skipping 0xFF00 and restart markers
            eoi_found = False
            while offset < data_len - 1:
                if data[offset] == 0xFF:
                    next_byte = data[offset + 1]
                    if next_byte == EOI:
                        image_info["eoi_offset"] = offset + 2
                        eoi_found = True
                        break
                    elif next_byte == 0x00 or (0xD0 <= next_byte <= 0xD7):
                        offset += 2
                        continue
                    elif next_byte == 0xFF:
                        offset += 1
                        continue
                    elif next_byte == SOS:
                        # Multi-scan progressive JPEG
                        offset += 2
                        continue
                offset += 1

            if not eoi_found:
                # Some JPEGs omit final EOI or have padding; check last 2 bytes
                if data[-2:] == b"\xFF\xD9":
                    image_info["eoi_offset"] = data_len
                else:
                    raise TruncatedJpegError("JPEG entropy data truncated; no EOI marker found.")
            break

        offset = payload_end

    if image_info["width"] is None or image_info["height"] is None:
        raise MalformedStructureError("Could not determine image dimensions from JPEG segments.")

    return segments, image_info
