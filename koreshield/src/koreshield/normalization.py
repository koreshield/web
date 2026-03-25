"""
Text normalization utilities for adversarial prompt detection.
"""

from __future__ import annotations

from base64 import b64decode
import binascii
import html
import re
import unicodedata
from urllib.parse import unquote

INVISIBLE_CHARS_RE = re.compile(
    r"[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2060\u2061\u2062\u2063\u2064]"
)
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


def normalize_text(text: str) -> dict[str, object]:
    """
    Normalize text so detector logic can evaluate both raw and obfuscated variants.
    """
    normalized = text
    layers: list[str] = []

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

    base64_decoded = _maybe_decode_base64(normalized)
    if base64_decoded != normalized:
        normalized = base64_decoded
        layers.append("base64_decode")

    hex_decoded = _maybe_decode_hex(normalized)
    if hex_decoded != normalized:
        normalized = hex_decoded
        layers.append("hex_decode")

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

    return {
        "original": text,
        "normalized": normalized,
        "layers": layers,
    }
