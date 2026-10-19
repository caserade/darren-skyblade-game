'use strict';
// Gives the game's pages a small, fixed set of desktop calls as window.skybladeDesktop. The page never gets
// Node or Electron itself. In a web browser there is no skybladeDesktop, so the game shows no Update tab.
const { contextBridge, ipcRenderer } = require('electron');

if (location.protocol === 'skyblade:') {
  const listeners = new Set();
  ipcRenderer.on('skyblade:update-status', (_e, s) => {
    for (const fn of listeners) {
      try {
        fn(s);
      } catch (err) {
        console.error(err);
      }
    }
  });
  contextBridge.exposeInMainWorld('skybladeDesktop', {
    version: ipcRenderer.sendSync('skyblade:version'),
    updates: {
      status: () => ipcRenderer.invoke('skyblade:update-status'),
      check: () => ipcRenderer.invoke('skyblade:update-check'),
      install: (channel) => ipcRenderer.invoke('skyblade:update-install', String(channel || '')),
      importZip: () => ipcRenderer.invoke('skyblade:update-import'),
      reset: () => ipcRenderer.invoke('skyblade:update-reset'),
      seen: () => ipcRenderer.invoke('skyblade:update-seen'),
      getApp: () => ipcRenderer.invoke('skyblade:get-app'),
      restart: () => ipcRenderer.invoke('skyblade:restart'),
      onStatus(fn) {
        if (typeof fn !== 'function') return () => {};
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    },
    fullScreen: () => ipcRenderer.invoke('skyblade:fullscreen'),
  });
}
