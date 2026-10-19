'use strict';
// A small zip reader (stored and deflated entries, no zip64) for importing a ChatGPT zip of the
// game. Entry names are checked by the caller; nothing is written here.
const zlib = require('node:zlib');

function readZip(buf) {
  if (buf.length < 22) throw new Error('not a zip file');
  // the end-of-central-directory record is in the last 64 KB
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--)
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  if (eocd < 0) throw new Error('not a zip file (no central directory)');
  const count = buf.readUInt16LE(eocd + 10),
    cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('zip64 archives are not supported');
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('damaged zip (central directory)');
    const method = buf.readUInt16LE(p + 10),
      crc = buf.readUInt32LE(p + 16),
      csize = buf.readUInt32LE(p + 20),
      usize = buf.readUInt32LE(p + 24),
      nlen = buf.readUInt16LE(p + 28),
      xlen = buf.readUInt16LE(p + 30),
      clen = buf.readUInt16LE(p + 32),
      local = buf.readUInt32LE(p + 42),
      name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8');
    if (csize === 0xffffffff || usize === 0xffffffff || local === 0xffffffff) throw new Error('zip64 archives are not supported');
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/')) continue; // folder entry
    entries.push({
      name,
      size: usize,
      read() {
        if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new Error('damaged zip (' + name + ')');
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const raw = buf.subarray(start, start + csize);
        let data;
        if (method === 0) data = Buffer.from(raw);
        else if (method === 8) data = zlib.inflateRawSync(raw);
        else throw new Error('unsupported compression in ' + name);
        if (data.length !== usize || (zlib.crc32 && zlib.crc32(data) !== crc)) throw new Error('damaged entry ' + name);
        return data;
      },
    });
  }
  return entries;
}

module.exports = { readZip };
