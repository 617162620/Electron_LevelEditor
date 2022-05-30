const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs');

let win;

/** 创建窗口 */
const createWindow = () => {
    //创建窗口
    win = new BrowserWindow({
        width: 600,
        height: 800,
        resizable: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,//在网页中集成Node
            nodeIntegrationInWorker: true,//是否在Web工作器中启用了Node集成
            enableRemoteModule: true,

            //官方案例写法, 不实用.
            // preload: path.join(__dirname, 'preload.js')
        }
    });

    // 加载 index.html
    win.loadFile('editor/index.html');

    // 打开开发工具
    // win.webContents.openDevTools();
}

//====== 监听全局事件
/** 刷新列表 (废弃) */
ipcMain.on("R2M_RefreshList", function (event, msg) {
    let mapsPath = msg;
    let files = fs.readdirSync(mapsPath);
    win.webContents.send("M2R_RefreshList", files);
})



app.whenReady().then(() => {
    const remote = require('@electron/remote/main');
    createWindow();
    remote.initialize();
    remote.enable(win.webContents);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. 也可以拆分成几个文件，然后用 require 导入。