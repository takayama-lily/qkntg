"use strict"
const axios = require("axios").default

const chat_id = "@konachan_wifi"
const tg_token = process.env.QKNTG_TOKEN
const target_gid = Number(process.env.KNT_GID)

/**
 * @param {string} text 
 */
function forwardTextToTelegram(text) {
    if (!tg_token) return
    if (text.length > 4096)
        text = text.slice(0, 4094) + ".."
    const data = `chat_id=${chat_id}&text=` + encodeURIComponent(text)
    axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, data, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
}

function forwardImagesToTelegram(imgs) {
    if (!imgs.length) return
    const data = {
        chat_id,
        media: imgs
    }
    axios.post(`https://api.telegram.org/bot${tg_token}/sendMediaGroup`, JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
}

/**
 * @param {import("oicq").GroupMessageEvent} data
 * @this {import("oicq").Client}
 */
function listener(data) {
    if (data.group_id !== target_gid || data.sender.user_id === this.uin) return
    forwardTextToTelegram(data.member.card + ": " + data.raw_message)
    const imgs = []
    for (const elem of data.message) {
        if (elem.type === "image")
            imgs.push({
                type: "photo",
                media: elem.url
            })
    }
    forwardImagesToTelegram(imgs)
}

/**
 * 当一个bot实例启用了此插件时被调用
 * @param {import("oicq").Client} bot 
 */
function activate(bot) {
    bot.on("message.group", listener)
}

/**
 * 当一个bot实例禁用了此插件时被调用
 * @param {import("oicq").Client} bot 
 */
function deactivate(bot) {
    bot.off("message.group", listener)
}

/**
 * 当插件被重启或卸载之前被调用，用来释放资源(例如监听的端口)
 * 若没有请求任何资源，不必导出此函数
 */
function destructor() {

}

module.exports = {
    activate, deactivate, destructor,
}
