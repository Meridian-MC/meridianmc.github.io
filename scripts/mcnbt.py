"""
Minimal NBT + Anvil region reader, dependency-free.

Enough to walk chunks, block entities, entities and player files looking for
items. Everything is decoded into plain dicts/lists so callers never touch the
binary format. Verified against MC 26.2 (DataVersion 4903): the region
container is unchanged (4 KiB sectors, zlib chunk payloads) and chunk NBT
still keys block entities under `block_entities` and items as
{id, count, components}.
"""
import gzip
import struct
import zlib


def _read(buf, pos, tag):
    if tag == 1:
        return buf[pos], pos + 1
    if tag == 2:
        return struct.unpack_from(">h", buf, pos)[0], pos + 2
    if tag == 3:
        return struct.unpack_from(">i", buf, pos)[0], pos + 4
    if tag == 4:
        return struct.unpack_from(">q", buf, pos)[0], pos + 8
    if tag == 5:
        return struct.unpack_from(">f", buf, pos)[0], pos + 4
    if tag == 6:
        return struct.unpack_from(">d", buf, pos)[0], pos + 8
    if tag == 7:                                     # byte array
        n = struct.unpack_from(">i", buf, pos)[0]
        pos += 4
        return buf[pos:pos + n], pos + n
    if tag == 8:                                     # string
        n = struct.unpack_from(">H", buf, pos)[0]
        pos += 2
        return buf[pos:pos + n].decode("utf8", "replace"), pos + n
    if tag == 9:                                     # list
        sub = buf[pos]
        n = struct.unpack_from(">i", buf, pos + 1)[0]
        pos += 5
        out = []
        for _ in range(n):
            v, pos = _read(buf, pos, sub)
            out.append(v)
        return out, pos
    if tag == 10:                                    # compound
        d = {}
        while True:
            t = buf[pos]
            pos += 1
            if t == 0:
                return d, pos
            n = struct.unpack_from(">H", buf, pos)[0]
            pos += 2
            name = buf[pos:pos + n].decode("utf8", "replace")
            pos += n
            d[name], pos = _read(buf, pos, t)
    if tag == 11:                                    # int array
        n = struct.unpack_from(">i", buf, pos)[0]
        pos += 4
        return list(struct.unpack_from(f">{n}i", buf, pos)), pos + 4 * n
    if tag == 12:                                    # long array
        n = struct.unpack_from(">i", buf, pos)[0]
        pos += 4
        return list(struct.unpack_from(f">{n}q", buf, pos)), pos + 8 * n
    raise ValueError(f"bad NBT tag {tag} at {pos}")


def parse(buf):
    """Uncompressed NBT blob -> the root compound as a dict (root name dropped)."""
    t = buf[0]
    n = struct.unpack_from(">H", buf, 1)[0]
    v, _ = _read(buf, 3 + n, t)
    return v


def parse_gz(raw):
    """A gzip-wrapped NBT file (player .dat, level.dat) -> dict."""
    return parse(gzip.decompress(raw))


def region_chunks(raw):
    """Yield (local_x, local_z, chunk_dict) for every chunk in an Anvil file.

    Damaged or half-written chunks are skipped rather than raised: a region
    fetched over FTP while the server is saving it can have a torn tail, and
    the next mtime change re-scans the file anyway.
    """
    if len(raw) < 8192:
        return
    for i in range(1024):
        off = struct.unpack_from(">I", raw, i * 4)[0]
        sector, count = off >> 8, off & 0xFF
        if sector == 0 or count == 0:
            continue
        p = sector * 4096
        if p + 5 > len(raw):
            continue
        length = struct.unpack_from(">I", raw, p)[0]
        comp = raw[p + 4]
        data = raw[p + 5:p + 4 + length]
        try:
            if comp == 2:
                blob = zlib.decompress(data)
            elif comp == 1:
                blob = gzip.decompress(data)
            elif comp == 3:
                blob = data
            else:
                continue                     # LZ4 / external chunks: not used here
            yield i % 32, i // 32, parse(blob)
        except Exception:
            continue
