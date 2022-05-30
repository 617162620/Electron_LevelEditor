const { contextBridge, ipcRenderer } = require("electron");

//===== 实现事件代理
let sendEvtList = ["Evt_SavePath"];
let receiveEvtList = ["fromMain"];
contextBridge.exposeInMainWorld(
  "api", {
  send: (channel, data) => {
    // whitelist channels
    if (sendEvtList.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    if (receiveEvtList.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
}
);

// 所有Node.js API都可以在预加载过程中使用。
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})