import io
import pytest
from werkzeug.datastructures import FileStorage
from PIL import Image
from app.services.validation import validate_upload
from app.utils.errors import (
    NoFileError,
    UnsupportedTypeError,
    InvalidSignatureError,
    TruncatedJpegError,
    FileTooLargeError,
)


def create_test_jpeg(width=100, height=100, color=(200, 100, 50)) -> bytes:
    """Generate in-memory valid JPEG bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_validation_success():
    """Valid JPEG must pass all validation checks and return bytes and info."""
    jpeg_bytes = create_test_jpeg(200, 150)
    fs = FileStorage(
        stream=io.BytesIO(jpeg_bytes),
        filename="test_photo.jpg",
        content_type="image/jpeg",
    )

    data, image_info, segments = validate_upload(fs)

    assert data == jpeg_bytes
    assert image_info["width"] == 200
    assert image_info["height"] == 150
    assert image_info["format"] == "JPEG"
    assert isinstance(segments, list)


def test_validation_no_file():
    """Empty or missing filename raises NoFileError (400)."""
    fs = FileStorage(stream=io.BytesIO(b""), filename="")
    with pytest.raises(NoFileError):
        validate_upload(fs)


def test_validation_unsupported_extension():
    """Non-jpeg extension (.png) raises UnsupportedTypeError (415)."""
    fs = FileStorage(
        stream=io.BytesIO(b"some content"),
        filename="image.png",
        content_type="image/png",
    )
    with pytest.raises(UnsupportedTypeError):
        validate_upload(fs)


def test_validation_invalid_magic_bytes():
    """File without FF D8 FF magic bytes raises InvalidSignatureError (415)."""
    fs = FileStorage(
        stream=io.BytesIO(b"NOT_A_JPEG_FILE_AT_ALL"),
        filename="image.jpg",
        content_type="image/jpeg",
    )
    with pytest.raises(InvalidSignatureError):
        validate_upload(fs)


def test_validation_truncated_jpeg():
    """JPEG truncated without EOI raises TruncatedJpegError (422)."""
    jpeg_bytes = create_test_jpeg()
    truncated_bytes = jpeg_bytes[: len(jpeg_bytes) // 2]
    fs = FileStorage(
        stream=io.BytesIO(truncated_bytes),
        filename="truncated.jpg",
        content_type="image/jpeg",
    )
    with pytest.raises(TruncatedJpegError):
        validate_upload(fs)
