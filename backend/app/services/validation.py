import io
import warnings
from PIL import Image
from app.config import config
from app.utils.errors import (
    NoFileError,
    FileTooLargeError,
    InvalidSignatureError,
    UnsupportedTypeError,
    CorruptImageError,
    TruncatedJpegError,
    ImageTooLargeError,
)
from app.services.jpeg_segments import parse_header_dimensions, scan_segments

# Enforce Pillow bounds limit per FR-UP-08
Image.MAX_IMAGE_PIXELS = config.MAX_MEGAPIXELS * 1_000_000


def validate_upload(file_storage) -> tuple[bytes, dict, list]:
    """
    Validate uploaded image according to PRD Section 5.3 (FR-UP-01 through FR-UP-09).
    Executed in strict sequential order. First failure aborts immediately.

    Returns:
        tuple (file_bytes, image_info, segments)
    """
    # FR-UP-01: Presence
    if not file_storage or not file_storage.filename:
        raise NoFileError("No image file provided in multipart field 'image'.")

    # FR-UP-06: Extension check
    filename = file_storage.filename.lower()
    if not (filename.endswith(".jpg") or filename.endswith(".jpeg")):
        raise UnsupportedTypeError("Filename must have a .jpg or .jpeg extension.")

    # FR-UP-05: Declared MIME (advisory check against spoofing)
    content_type = (file_storage.content_type or "").lower()
    if content_type and content_type not in ["image/jpeg", "image/jpg", "application/octet-stream"]:
        raise UnsupportedTypeError(f"Unsupported MIME type '{content_type}'. Only JPEG is accepted.")

    # FR-UP-02: Size check with bounded read
    # Read in chunks to prevent memory exhaustion
    chunk_size = 64 * 1024
    byte_buffer = bytearray()
    total_read = 0

    while True:
        chunk = file_storage.read(chunk_size)
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > config.MAX_UPLOAD_BYTES:
            raise FileTooLargeError(
                f"File size exceeds the {config.MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit.",
                max_bytes=config.MAX_UPLOAD_BYTES,
            )
        byte_buffer.extend(chunk)

    if len(byte_buffer) == 0:
        raise NoFileError("Uploaded file is empty (0 bytes).")

    data = bytes(byte_buffer)

    # FR-UP-03: Magic bytes
    if len(data) < 3 or data[0] != 0xFF or data[1] != 0xD8 or data[2] != 0xFF:
        raise InvalidSignatureError("File does not start with valid JPEG magic bytes (FF D8 FF).")

    # FR-UP-04: Trailer sanity check
    # Check if last 2 bytes are EOI or near the end
    has_trailer = (data[-2:] == b"\xFF\xD9") or (b"\xFF\xD9" in data[-32:])
    if not has_trailer:
        raise TruncatedJpegError("JPEG file is missing End-of-Image (FF D9) marker.")

    # FR-UP-07: Header-level dimensions check without full pixel decoding
    header_dims = parse_header_dimensions(data)

    # FR-UP-08: Pillow decode verification
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)

            # Step 1: verify() proves headers and integrity
            img = Image.open(io.BytesIO(data))
            if img.format != "JPEG":
                raise UnsupportedTypeError(f"Decoded image format is '{img.format}', expected 'JPEG'.")
            img.verify()

            # Step 2: re-open and load() to prove raster data decodes
            img_load = Image.open(io.BytesIO(data))
            img_load.load()

            # Sanity check dimensions match
            width, height = img_load.size
            if width * height > config.MAX_MEGAPIXELS * 1_000_000:
                raise ImageTooLargeError(
                    f"Image resolution {width}x{height} exceeds limit.",
                    max_mp=config.MAX_MEGAPIXELS,
                )
    except Image.DecompressionBombWarning:
        raise ImageTooLargeError("Image triggers decompression bomb threshold.")
    except (UnsupportedTypeError, ImageTooLargeError):
        raise
    except Exception as e:
        raise CorruptImageError(f"Image decompression failed: {str(e)}")

    # FR-UP-09: Segment structure scan
    segments, image_info = scan_segments(data)

    # Merge header dimensions
    image_info.update(header_dims)
    image_info["size_bytes"] = len(data)

    return data, image_info, segments
