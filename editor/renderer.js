const { ipcRenderer } = require("electron");
const { dialog } = require('@electron/remote')
const path = require('path')
const fs = require('fs');



//===== 路径_读取文件
let g_cfgPath = path.join(__dirname, 'ToolConfig.json')
let g_cfgContent = fs.readFileSync(g_cfgPath, { encoding: "utf-8" })
let g_toolConfig = JSON.parse(g_cfgContent)
document.getElementById("mapsPath").value = g_toolConfig.mapsPath;

//===== 路径_保存文件
document.getElementById("btn_savePath").addEventListener("click", savePath);
function savePath() {
    let newPath = document.getElementById("mapsPath").value;
    g_toolConfig.mapsPath = newPath;

    let cfgPath = path.join(__dirname, 'ToolConfig.json')
    fs.writeFile(cfgPath, JSON.stringify(g_toolConfig), (err) => {
        let msg = "";
        let detail = "";
        if (err) {
            msg = "保存出错!";
            detail = err;
        }
        else {
            msg = "保存成功!";
        }
        dialog.showMessageBox({
            type: "warning",
            title: "保存配置",
            message: msg,
            detail: detail,
            buttons: ["确定"]
        }).then((res) => {
            console.log(res);
        });
    });
}



//===== 配置_选择配置
let g_cfgItemList = [];
let g_cfgList = [];
let g_curCfgPath = "";
let chooseCfgEvt = (mapPath) => {
    //重置编辑器
    resetEditor();
    g_curCfgPath = mapPath;
    //根据文件刷新编辑器
    let mapContent = fs.readFileSync(g_curCfgPath, { encoding: "utf-8" })
    g_mapDataList = JSON.parse(mapContent);
    g_tempMapDataList = JSON.parse(mapContent);
    for (let mapData of g_mapDataList) {
        if (mapData == null) {
            continue;
        }
        console.log(">>>>  输出单个格子:", mapData);
        //设置格子_类(背景图)
        let xIdx = mapData["rowIdx"];
        let yIdx_Data = mapData["columnIdx"];
        let yIdx_UI = g_columnCnt - 1 - mapData["columnIdx"];
        let itemIdx_UI = yIdx_UI * g_rowCnt + xIdx;
        let cellItem = g_cellItemList[itemIdx_UI];
        cellItem.setAttribute("class", `cellItem${mapData["type"]}`);
        //设置格子_文本显示
        let useCnt = mapData["useCnt"] > 0 ? mapData["useCnt"] : "";
        cellItem.innerHTML = useCnt;
    }
}
//===== 配置_item事件
let cfgItemEvt = (targetIdx) => {
    for (let idx = 0; idx < g_cfgItemList.length; idx++) {
        g_cfgItemList[idx].style['background-color'] = idx == targetIdx ? 'rgb(200, 200, 250)' : 'rgb(180, 180, 180)';
    }
    let mapPath = path.join(g_toolConfig.mapsPath, g_cfgList[targetIdx]);

    saveLogic(() => { chooseCfgEvt(mapPath) }, this);
}
//===== 配置_刷新配置
document.getElementById("btn_refreshList").addEventListener("click", refreshList);
function refreshList() {
    let mapsPath = g_toolConfig.mapsPath;
    //缓存数据
    g_cfgList = fs.readdirSync(mapsPath);
    //获取父节点
    let cfgView = document.getElementById('cfgView');
    //移除旧Item
    for (let idx = g_cfgItemList.length - 1; idx >= 0; idx--) {
        cfgView.removeChild(g_cfgItemList[idx]);
    }
    g_cfgItemList.length = 0;

    for (let idx = 0; idx < g_cfgList.length; idx++) {
        let cfgItem = document.createElement('button');
        cfgItem.setAttribute('class', 'cfgItem');
        cfgItem.innerHTML = g_cfgList[idx];
        cfgView.appendChild(cfgItem);
        g_cfgItemList.push(cfgItem);
        cfgItem.addEventListener("click", () => { cfgItemEvt(idx); });
    }
}
//初始化默认执行一次
refreshList();



//===== 格子
let g_rowCnt = 9;
let g_columnCnt = 9;
let g_cellItemList = [];
let g_mapDataList = [];
let g_tempMapDataList = []; //缓存地图数据列表 (用于对比是否操作过)
//===== 格子_item事件
let cellItemEvt = (idxX, idxY) => {
    //筛选误操作
    if (g_optType < 0) {
        dialog.showMessageBoxSync({
            type: "warning",
            title: "操作错误",
            message: "操作错误!",
            detail: "请先选择格子类型!",
            buttons: ["确定"]
        });
        return;
    }

    let itemIdx_UI = idxY * g_rowCnt + idxX;
    //item索引 (对应总列表)
    let idxY_Data = g_columnCnt - 1 - idxY;
    let itemIdx_Data = idxY_Data * g_rowCnt + idxX;
    console.log(">>>>  点击格子:", idxX, idxY, itemIdx_UI, itemIdx_Data);

    //删除格子
    if (g_optType == 0) {
        g_mapDataList[itemIdx_Data] = null;
        //设置格子Ui
        let cellItem = document.getElementById(`cellItem_${itemIdx_UI}`);
        cellItem.setAttribute("class", `cellItem0`);
        cellItem.innerHTML = "";
        return;
    }
    //处理数据
    let mapData = g_mapDataList[itemIdx_Data];
    if (mapData == null) {
        mapData = {};
        mapData["rowIdx"] = idxX;
        mapData["columnIdx"] = idxY_Data;
        mapData["itemIdx"] = itemIdx_Data;
        mapData["type"] = g_optType;
        mapData["useCnt"] = 0;
    }
    else {
        mapData["rowIdx"] = idxX;
        mapData["columnIdx"] = idxY_Data;
        mapData["itemIdx"] = itemIdx_Data;
        mapData["type"] = g_optType;
    }
    //普通格子
    if (g_optType == 1) {
        mapData["useCnt"] = 0;
    }
    //多次格子
    else if (g_optType == 2) {
        mapData["useCnt"]++;
    }
    //永久格子
    else if (g_optType == 3) {
        mapData["useCnt"] = 0;
    }
    g_mapDataList[itemIdx_Data] = mapData;
    //设置格子_类(背景图)
    let cellItem = g_cellItemList[itemIdx_UI];
    cellItem.setAttribute("class", `cellItem${g_optType}`);
    //设置格子_文本显示
    let useCnt = mapData["useCnt"] > 0 ? mapData["useCnt"] : "";
    cellItem.innerHTML = useCnt;
}
//===== 格子_创建item
let cellView = document.getElementById('cellView');
for (let idxY = 0; idxY < g_rowCnt; idxY++) {
    for (let idxX = 0; idxX < g_columnCnt; idxX++) {
        let itemIdx = idxY * g_rowCnt + idxX;
        let cellItem = document.createElement('button');
        cellItem.setAttribute('id', `cellItem_${itemIdx}`);
        cellItem.setAttribute('class', 'cellItem0');
        // cellItem.setAttribute('class', `cellItem${itemIdx % 4}`);
        cellView.appendChild(cellItem);
        g_cellItemList.push(cellItem);
        cellItem.addEventListener("click", () => { cellItemEvt(idxX, idxY); });
    }
}



//===== 操作
let g_optType = -1;
let g_optItemList = [];
//===== 操作_item事件
let optItemEvt = (type) => {
    g_optType = type;
    for (let idx = 0; idx < g_optItemList.length; idx++) {
        g_optItemList[idx].style['background-color'] = idx == type ? 'rgb(200, 200, 250)' : 'transparent';
    }
}
//===== 操作_创建item
let optView = document.getElementById('optView');
for (let type = 0; type < 4; type++) {
    let optItem = document.getElementById(`optItem${type}`);
    g_optItemList.push(optItem);
    optItem.addEventListener("click", () => {
        optItemEvt(type);
    });
}



//===== 地图配置_清除
document.getElementById("btn_clearBtn").addEventListener("click", clearEditor);
function clearEditor() {
    g_mapDataList.length = 0;
    for (let cellItem of g_cellItemList) {
        cellItem.setAttribute("class", `cellItem0`);
        cellItem.innerHTML = "";
    }
}
//===== 地图配置_保存
document.getElementById("btn_saveCfgBtn").addEventListener("click", saveConfig);
function saveConfig() {
    saveLogic(() => {
        if (g_curCfgPath) {
            chooseCfgEvt(g_curCfgPath)
        }
        else {
            resetEditor();
        }
    }, this);
}



//===== 重置编辑器
let resetEditor = () => {
    g_curCfgPath = "";
    g_mapDataList.length = 0;
    g_tempMapDataList.length = 0;
    for (let cellItem of g_cellItemList) {
        cellItem.setAttribute("class", `cellItem0`);
        cellItem.innerHTML = "";
    }
}
//===== 保存逻辑
let saveLogic = (callback, caller) => {
    //判断是否编辑过地图
    if (JSON.stringify(g_mapDataList) != JSON.stringify(g_tempMapDataList)) {
        let haveCfg = g_curCfgPath != "";
        let msg = haveCfg ? "是否覆盖当前地图?" : "是否保存当前编辑地图?";
        let detail = haveCfg ? "[确定: 覆盖]   [取消: 丢弃并跳转]" : "[确定: 保存]   [取消: 丢弃并跳转]";
        let btnIdx = dialog.showMessageBoxSync({
            type: "warning",
            title: "编辑地图",
            message: msg,
            detail: detail,
            buttons: ["取消", "确定"]
        });
        if (btnIdx == 0) {
            //如果点击取消, 执行回调.
            callback.apply(caller);
        }
        else if (btnIdx == 1) {
            if (haveCfg) {
                //如果有路径, 直接写入覆盖.
                let writeStr = JSON.stringify(g_mapDataList);
                fs.writeFile(g_curCfgPath, writeStr, (err) => {
                    let msg = "";
                    let detail = "";
                    if (err) {
                        msg = "保存出错!";
                        detail = err;
                    }
                    else {
                        msg = "保存成功!";
                        //重置缓存数据
                        g_tempMapDataList = JSON.parse(writeStr);
                    }
                    dialog.showMessageBox({
                        type: "warning",
                        title: "保存地图",
                        message: msg,
                        detail: detail,
                        buttons: ["确定"]
                    });
                });
            }
            else {
                //如果没有路径, 提示保存.
                const res = dialog.showSaveDialogSync({
                    title: '保存文件',
                    buttonLabel: '保存',
                    filters: [
                        {
                            name: 'temp', extensions: ['json']
                        }
                    ]
                });
                fs.writeFile(res, JSON.stringify(g_mapDataList), (err) => {
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
                        title: "保存地图",
                        message: msg,
                        detail: detail,
                        buttons: ["确定"]
                    });
                });
            }
        }
        return;
    }

    //如果未编辑过地图, 直接执行回调.
    callback.apply(caller);
}
