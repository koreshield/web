"""
Text normalization utilities for adversarial prompt detection.
"""

from __future__ import annotations

from base64 import b64decode
import binascii
import codecs
import html
import re
import unicodedata
from urllib.parse import unquote

INVISIBLE_CHARS_RE = re.compile(
    r"[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2060\u2061\u2062\u2063\u2064]"
)
MORSE_PATTERN_RE = re.compile(r"[\.\-\/ ]{10,}")  # Detect sequences of dots, dashes, slashes
MULTISPACE_RE = re.compile(r"\s+")
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
MARKDOWN_HEADER_RE = re.compile(r"^\s{0,3}#{1,6}\s+", re.MULTILINE)
LEET_REPLACEMENTS = str.maketrans(
    {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
    }
)
HOMOGLYPH_REPLACEMENTS = {
    ord("\u0430"): "a",  # Cyrillic a
    ord("\u0435"): "e",  # Cyrillic e
    ord("\u043E"): "o",  # Cyrillic o
    ord("\u0440"): "p",  # Cyrillic p
    ord("\u0441"): "c",  # Cyrillic c
    ord("\u0445"): "x",  # Cyrillic x
    ord("\u0456"): "i",  # Cyrillic i
    ord("\u03BF"): "o",  # Greek omicron
    ord("\u03B1"): "a",  # Greek alpha
    ord("\u03B5"): "e",  # Greek epsilon
    ord("\u03C1"): "p",  # Greek rho
    ord("\u03C7"): "x",  # Greek chi
    ord("\uFF41"): "a",  # fullwidth a
    ord("\uFF45"): "e",  # fullwidth e
    ord("\uFF49"): "i",  # fullwidth i
    ord("\uFF4F"): "o",  # fullwidth o
    ord("\uFF53"): "s",  # fullwidth s
    ord("\uFF54"): "t",  # fullwidth t
}


def _maybe_decode_base64(value: str) -> str:
    compact = value.strip()
    if len(compact) < 24 or len(compact) % 4 != 0:
        return value
    if not re.fullmatch(r"[A-Za-z0-9+/=\s]+", compact):
        return value
    try:
        decoded = b64decode(compact, validate=True)
        decoded_text = decoded.decode("utf-8")
    except (ValueError, UnicodeDecodeError, binascii.Error):
        return value
    if sum(ch.isprintable() or ch.isspace() for ch in decoded_text) / max(len(decoded_text), 1) < 0.85:
        return value
    return decoded_text


def _maybe_decode_rot13(value: str) -> str:
    """Decode ROT13 when explicitly referenced.

    Heuristic: the text mentions 'ROT13' or 'rot-13' and contains a plausible
    encoded segment (mostly letters/spaces, long enough to be a sentence).
    We apply ROT13 to the full string and return the result only if it contains
    recognisable English trigger words that differ from the original.
    """
    if not re.search(r"\brot.?13\b", value, re.IGNORECASE):
        return value
    try:
        decoded = codecs.decode(value, "rot_13")
    except Exception:
        return value
    # Accept the decoded form only if it looks more English than the original
    # (proxy: ratio of ASCII letters in [a-zA-Z] stays high after decode)
    alpha_ratio = sum(c.isalpha() for c in decoded) / max(len(decoded), 1)
    if alpha_ratio > 0.4:
        return decoded
    return value


def _maybe_decode_hex(value: str) -> str:
    compact = value.strip().replace(" ", "")
    if len(compact) < 16 or len(compact) % 2 != 0:
        return value
    if not re.fullmatch(r"[0-9a-fA-F]+", compact):
        return value
    try:
        decoded = bytes.fromhex(compact).decode("utf-8")
    except ValueError:
        return value
    if sum(ch.isprintable() or ch.isspace() for ch in decoded) / max(len(decoded), 1) < 0.85:
        return value
    return decoded


def _maybe_decode_caesar(value: str) -> str:
    """Decode Caesar cipher when explicitly referenced.

    Heuristic: the text mentions 'Caesar', 'shift N', or 'rot-N' (where N≠13).
    Try that specific shift. Only apply to letters (preserve case).
    Return decoded text if it differs from original.
    """
    # Check for Caesar cipher reference
    caesar_match = re.search(r"(?:caesar|shift\s+(\d+)|rot-(\d+))", value, re.IGNORECASE)
    if not caesar_match:
        return value

    # Extract shift value (if mentioned)
    shift = None
    if caesar_match.group(1):
        shift = int(caesar_match.group(1))
    elif caesar_match.group(2):
        shift = int(caesar_match.group(2))

    # Try common shifts (1-25) if not specified
    shifts_to_try = [shift] if shift else range(1, 26)

    for s in shifts_to_try:
        decoded = []
        for char in value:
            if char.isalpha():
                if char.isupper():
                    decoded.append(chr((ord(char) - ord('A') + s) % 26 + ord('A')))
                else:
                    decoded.append(chr((ord(char) - ord('a') + s) % 26 + ord('a')))
            else:
                decoded.append(char)
        decoded_text = ''.join(decoded)

        # Accept if it differs and looks like English (>40% letters, no excessive control chars)
        if decoded_text != value:
            alpha_ratio = sum(c.isalpha() for c in decoded_text) / max(len(decoded_text), 1)
            if alpha_ratio > 0.35:
                return decoded_text

    return value


def _maybe_decode_morse(value: str) -> str:
    """Decode Morse code when detected.

    Heuristic: text contains sequences of dots, dashes, slashes (Morse pattern).
    Return decoded text appended to original.
    """
    if not MORSE_PATTERN_RE.search(value):
        return value

    # Morse to letter mapping
    morse_map = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
        '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
        '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
        '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
        '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
        '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
        '....-': '4', '.....': '5', '-....': '6', '--...': '7',
        '---..': '8', '----.': '9', '-----': '0'
    }

    try:
        # Split by word boundary (/) then by letter boundary (space)
        words = value.split('/')
        decoded_words = []
        for word in words:
            letters = word.strip().split()
            decoded_word = ''.join(morse_map.get(letter, '') for letter in letters)
            if decoded_word:
                decoded_words.append(decoded_word)

        decoded_text = ' '.join(decoded_words)
        if decoded_text:
            # Return decoded appended to original
            return value + " [MORSE DECODED: " + decoded_text + "]"
    except Exception:
        pass

    return value


def normalize_text(text: str) -> dict[str, object]:
    """
    Normalize text so detector logic can evaluate both raw and obfuscated variants.
    Includes multi-pass normalization to handle nested encoding attacks.
    """
    normalized = text
    layers: list[str] = []

    # First pass: standard normalization
    unicode_normalized = unicodedata.normalize("NFKC", normalized)
    if unicode_normalized != normalized:
        normalized = unicode_normalized
        layers.append("unicode_nfkc")

    html_decoded = html.unescape(normalized)
    if html_decoded != normalized:
        normalized = html_decoded
        layers.append("html_entities")

    url_decoded = unquote(normalized)
    if url_decoded != normalized:
        normalized = url_decoded
        layers.append("url_decode")

    stripped_invisibles = INVISIBLE_CHARS_RE.sub("", normalized)
    if stripped_invisibles != normalized:
        normalized = stripped_invisibles
        layers.append("invisible_strip")

    homoglyph_normalized = normalized.translate(HOMOGLYPH_REPLACEMENTS)
    if homoglyph_normalized != normalized:
        normalized = homoglyph_normalized
        layers.append("homoglyph_map")

    rot13_decoded = _maybe_decode_rot13(normalized)
    if rot13_decoded != normalized:
        normalized = rot13_decoded
        layers.append("rot13_decode")

    base64_decoded = _maybe_decode_base64(normalized)
    if base64_decoded != normalized:
        normalized = base64_decoded
        layers.append("base64_decode")

    hex_decoded = _maybe_decode_hex(normalized)
    if hex_decoded != normalized:
        normalized = hex_decoded
        layers.append("hex_decode")

    caesar_decoded = _maybe_decode_caesar(normalized)
    if caesar_decoded != normalized:
        normalized = caesar_decoded
        layers.append("caesar_decode")

    morse_decoded = _maybe_decode_morse(normalized)
    if morse_decoded != normalized:
        normalized = morse_decoded
        layers.append("morse_decode")

    leet_normalized = normalized.translate(LEET_REPLACEMENTS)
    if leet_normalized != normalized:
        normalized = leet_normalized
        layers.append("leet_map")

    markdown_stripped = MARKDOWN_LINK_RE.sub(r"\1", normalized)
    markdown_stripped = markdown_stripped.replace("```", " ").replace("`", " ")
    markdown_stripped = MARKDOWN_HEADER_RE.sub("", markdown_stripped)
    if markdown_stripped != normalized:
        normalized = markdown_stripped
        layers.append("markdown_strip")

    collapsed = MULTISPACE_RE.sub(" ", normalized).strip()
    if collapsed != normalized:
        normalized = collapsed
        layers.append("whitespace_collapse")

    # Multi-pass normalization: if any encoding layer was applied in first pass,
    # run a second pass to handle nested encoding (e.g., Base64-inside-ROT13)
    encoding_layers = {
        "base64_decode", "rot13_decode", "caesar_decode", "morse_decode",
        "hex_decode"
    }
    if any(layer in layers for layer in encoding_layers):
        # Second pass: apply all decoders again
        second_pass_before = normalized

        rot13_decoded = _maybe_decode_rot13(normalized)
        if rot13_decoded != normalized:
            normalized = rot13_decoded
            layers.append("rot13_decode")

        base64_decoded = _maybe_decode_base64(normalized)
        if base64_decoded != normalized:
            normalized = base64_decoded
            layers.append("base64_decode")

        hex_decoded = _maybe_decode_hex(normalized)
        if hex_decoded != normalized:
            normalized = hex_decoded
            layers.append("hex_decode")

        caesar_decoded = _maybe_decode_caesar(normalized)
        if caesar_decoded != normalized:
            normalized = caesar_decoded
            layers.append("caesar_decode")

        morse_decoded = _maybe_decode_morse(normalized)
        if morse_decoded != normalized:
            normalized = morse_decoded
            layers.append("morse_decode")

        if normalized != second_pass_before:
            layers.append("multi_pass_2")

    return {
        "original": text,
        "normalized": normalized,
        "layers": layers,
    }
