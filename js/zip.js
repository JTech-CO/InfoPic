/* Minimal ZIP STORE writer. PNG files are already compressed; no external library is needed. */
'use strict';
(function (IP) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  const crc32 = bytes => { let c = 0xFFFFFFFF; for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  class ZipWriter {
    constructor() { this.parts = []; this.entries = []; this.offset = 0; }
    async add(name, blob) {
      const data = new Uint8Array(await blob.arrayBuffer());
      const filename = new TextEncoder().encode(name);
      const crc = crc32(data), size = data.length;
      if (this.offset + size > 0xFFFFFFFF || filename.length > 65535) throw new Error('ZIP size limit exceeded');
      const d = new Date(), time = d.getHours() << 11 | d.getMinutes() << 5 | d.getSeconds() >> 1;
      const date = (Math.max(1980, d.getFullYear()) - 1980) << 9 | (d.getMonth() + 1) << 5 | d.getDate();
      const header = new Uint8Array(30), v = new DataView(header.buffer);
      v.setUint32(0, 0x04034B50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x800, true);
      v.setUint16(10, time, true); v.setUint16(12, date, true); v.setUint32(14, crc, true);
      v.setUint32(18, size, true); v.setUint32(22, size, true); v.setUint16(26, filename.length, true);
      this.parts.push(header, filename, data);
      this.entries.push({ filename, crc, size, time, date, offset: this.offset });
      this.offset += 30 + filename.length + size;
    }
    finish() {
      const central = [], start = this.offset;
      for (const e of this.entries) {
        const h = new Uint8Array(46), v = new DataView(h.buffer);
        v.setUint32(0, 0x02014B50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true); v.setUint16(8, 0x800, true);
        v.setUint16(12, e.time, true); v.setUint16(14, e.date, true); v.setUint32(16, e.crc, true);
        v.setUint32(20, e.size, true); v.setUint32(24, e.size, true); v.setUint16(28, e.filename.length, true);
        v.setUint32(42, e.offset, true);
        central.push(h, e.filename); this.offset += 46 + e.filename.length;
      }
      const end = new Uint8Array(22), v = new DataView(end.buffer);
      v.setUint32(0, 0x06054B50, true); v.setUint16(8, this.entries.length, true); v.setUint16(10, this.entries.length, true);
      v.setUint32(12, this.offset - start, true); v.setUint32(16, start, true);
      return new Blob([...this.parts, ...central, end], { type: 'application/zip' });
    }
  }
  IP.ZipWriter = ZipWriter;
})(window.InfoPic);

