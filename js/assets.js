'use strict';
(function (IP) {
  const readDataURL = file => new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('fileReadFailed')); r.readAsDataURL(file);
  });
  const decode = src => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('invalidImage')); image.src = src;
  });
  const toBlob = (canvas, type = 'image/png', quality) => new Promise((resolve, reject) => {
    try { canvas.toBlob(b => b ? resolve(b) : reject(new Error('exportFailed')), type, quality); } catch (_) { reject(new Error('exportFailed')); }
  });
  class AssetStore {
    constructor() { this.items = new Map(); this.images = new Map(); this.faces = new Map(); this.effects = new Map(); }
    async imageFromFile(file) {
      if (!file || file.size > 30 * 1024 * 1024 || !/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('invalidImage');
      const data = await readDataURL(file), image = await decode(data);
      if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 50000000) throw new Error('imageTooLarge');
      let finalData = data, finalImage = image;
      if (Math.max(image.naturalWidth, image.naturalHeight) > 4096) {
        const c = document.createElement('canvas'), scale = 4096 / Math.max(image.naturalWidth, image.naturalHeight);
        c.width = Math.round(image.naturalWidth * scale); c.height = Math.round(image.naturalHeight * scale);
        c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
        finalData = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
        finalImage = await decode(finalData); c.width = c.height = 1;
      }
      const item = { id: IP.uid(), kind: 'image', name: file.name, data: finalData };
      this.items.set(item.id, item); this.images.set(item.id, finalImage); return item;
    }
    async fontFromFile(file) {
      if (!file || file.size > 15 * 1024 * 1024 || !/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('invalidFont');
      const ext = file.name.split('.').at(-1).toLowerCase();
      const source = await readDataURL(file), data = `data:font/${ext};base64,${source.split(',')[1]}`;
      const item = { id: IP.uid(), kind: 'font', name: file.name, data };
      await this.loadFont(item); this.items.set(item.id, item); return item;
    }
    async loadFont(item) {
      try {
        const face = new FontFace('InfoPic-' + item.id, `url(${item.data})`);
        await face.load(); document.fonts.add(face); this.faces.set(item.id, face);
      } catch (_) { throw new Error('invalidFont'); }
    }
    async hydrate(items) {
      for (const item of items) {
        if (item.kind === 'image') {
          const image = await decode(item.data);
          if (image.naturalWidth * image.naturalHeight > 50000000) throw new Error('imageTooLarge');
          this.images.set(item.id, image);
        } else await this.loadFont(item);
        this.items.set(item.id, item);
      }
    }
    serialized(project) { const ids = IP.referencedAssets(project); return [...this.items.values()].filter(item => ids.has(item.id)); }
    clearEffects() { for (const c of this.effects.values()) c.width = c.height = 1; this.effects.clear(); }
    dispose() { this.clearEffects(); for (const f of this.faces.values()) document.fonts.delete(f); this.items.clear(); this.images.clear(); this.faces.clear(); }
  }
  const backup = {
    async db() {
      return new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) { reject(new Error('backupFailed')); return; }
        const request = indexedDB.open('infopic-local', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('backup');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('backupFailed'));
      });
    },
    async get() {
      const db = await this.db();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readonly'), req = tx.objectStore('backup').get('current');
        req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(new Error('backupFailed')); tx.oncomplete = () => db.close();
      });
    },
    async put(value) {
      const db = await this.db();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readwrite'), store = tx.objectStore('backup');
        value === null ? store.delete('current') : store.put(value, 'current');
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(new Error('backupFailed')); };
      });
    }
  };
  IP.AssetStore = AssetStore; IP.backup = backup; IP.toBlob = toBlob;
})(window.InfoPic);

