"use strict"
const fs = require("fs")
const path = require("path")
const axios = require("axios").default

/**
 * @type {import("oicq").Client}
 */
let qq = null

const chat_id = "konachan_wifi"
const tg_token = process.env.QKNTG_TOKEN
const target_gid = Number(process.env.KNT_GID)

const timer = setInterval(pollTelegramMessage, 3000)
let update_id = 0
const idfile = path.join(__dirname, "telegram_update_id") 
fs.readFile(idfile, (err, data) => {
    if (!err) update_id = Number(String(data))
})

function pollTelegramMessage() {
    const url = `https://api.telegram.org/bot${tg_token}/getUpdates?offset=${update_id + 1}`
    axios.get(url).then(rsp => {
        const data = rsp.data.result
        let id = update_id
        for (const node of data) {
            id = node.update_id
            if (!node.message) continue
            const msg = node.message
            if (msg.chat.username !== chat_id) continue
            if (Date.now() - msg.date * 1000 > 30000) continue
            if (msg.text)
                qq?.sendGroupMsg(target_gid, msg.from.first_name + ": " + msg.text)
        }
        update_id = id
        fs.writeFile(idfile, String(update_id), () => {})
    })
}

/**
 * @param {string} text 
 */
function forwardTextToTelegram(text) {
    if (!tg_token) return
    if (text.length > 4096)
        text = text.slice(0, 4094) + ".."
    const data = `chat_id=@${chat_id}&text=` + encodeURIComponent(text)
    axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, data, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
}

function forwardImagesToTelegram(imgs) {
    if (!imgs.length) return
    const data = {
        chat_id: "@" + chat_id,
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
 * ?????????bot????????????????????????????????????
 * @param {import("oicq").Client} bot 
 */
function activate(bot) {
    qq = bot
    bot.on("message.group", listener)
}

/**
 * ?????????bot????????????????????????????????????
 * @param {import("oicq").Client} bot 
 */
function deactivate(bot) {
    qq = null
    bot.off("message.group", listener)
}

/**
 * ???????????????????????????????????????????????????????????????(?????????????????????)
 * ???????????????????????????????????????????????????
 */
function destructor() {
    clearInterval(timer)
}

module.exports = {
    activate, deactivate, destructor,
}
