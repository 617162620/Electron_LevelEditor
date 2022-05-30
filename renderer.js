const { ipcRenderer } = require("electron");
const { dialog } = require('@electron/remote')
const path = require('path')
const fs = require('fs');

/** 写入文件 */
function Editor_WriteFile(path, content) {
    console.log(">>>>  调用写入文件:", path, content);
    fs.writeFile(path, content, (err) => {
        let msg = "";
        let detail = "";
        if (err) {
            msg = "保存出错!";
            detail = err;
        }
        else {
            msg = "保存成功!";
            //重置编辑器
            resetEditor();
        }
        dialog.showMessageBox({
            type: "warning",
            title: "保存文件",
            message: msg,
            detail: detail,
            buttons: ["确定"]
        });
    });
}

window["Editor_WriteFile"] = Editor_WriteFile;
