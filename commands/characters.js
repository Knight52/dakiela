import {db} from "@/database/database.js";
import {  DiscordRequest, DiscordTextResponse, DiscordUpdateTextResponse, DiscordSelectionBoxResponse, DiscordEmbedResponse } from '../utils.js';
import * as embed from "./embeds.js";

const activeWorkweekModification = {};

export async function coin(req, res, optionsData, userId)
{
    var offset = 0;
    if(optionsData["add"] != null)
        offset += optionsData["add"];
    if(optionsData["remove"] != null)
        offset -= optionsData["remove"];
    
    var embedContent = [];
    let title = null;
    if(offset != 0)
    {
        var content = {};
        await db.execute({sql: "update character set coin = coin + ? where owner = ? and current = 1", args: [offset, userId]});
        if(offset > 0)
        {
            title = "เพิ่มเงินจำนวน " + offset + " gp แล้ว\n";
        }
        else if (offset < 0)
        {
            title = "ลดเงินจำนวน " + offset + " gp แล้ว\n";
        }
    }

    var charResult = (await db.execute({sql: "select * from character where owner = ? and current = 1", args: [userId]})).rows[0];

    embedContent.push(await embed.coinEmbed(charResult.id, offset, title));

    return DiscordEmbedResponse(res, req, embedContent);
}
export async function workweek(req, res, optionsData, userId)
{
    var message = "";
    if(optionsData["add"] != null)
    {
        var result = await db.execute({
            sql: "update character set workweek = workweek + ? where owner = ? and current = 1", 
            args: [optionsData["add"], userId]}
        );
        message = "อัพเดทแล้ว!\n";
    }
    if(optionsData["remove"] != null)
    {
        var result = await db.exeucte({
            sql: "update character set workweek = max(workweek - ?, 0) where owner = ? and current = 1",
            args: [optionsData["remove"], userId]
        });
        message = "อัพเดทแล้ว!\n";
    }

    var result = await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })
    message += result.name + " มี " + result.workweek + " workweek.";

    return DiscordEmbedResponse(res, req, [{
        title: "เรียบร้อย",
        description: message,
        thumbnail:{
            url: "https://img2.pic.in.th/jthtcl9dny791.webp"
        }
    }]);
}

export async function edit(res, req, optionsData, userId)
{
    var q = "select * from character where ";
    var param = userId;
    if(optionsData.oldname != null)
    {
        q += " name = ?";
        param = optionsData.oldname;
    }
    else
    {
        q += " current = 1 and owner = ?";
    }

    var result = await db.execute({
        sql: q,
        args: [param]
    })

    if(result == null)
        return DiscordTextResponse("หาตัวละครไม่เจอ");

    var name = result.name;
    var link = result.link;

    if(optionsData.newname != null)
        name = optionsData.newname;
    if(optionsData.link != null)
        link = optionsData.link;

    await db.execute({
        sql: "update character set name = ?, link = ? where id = ?",
        args: [name, link, result.id]
    })

    result = await db.execute({
        sql: "select * from character where id = ?",
        args: [result.id]
    });

    return DiscordEmbedResponse(res, req, [
        {
            title: "อัพเดทแล้ว!",
            description: "ชื่อ: " + result.name + "\nลิงค์: " + result.link,
            thumbnail: {
                url: "https://img2.pic.in.th/2c3cd899169688bc9e99b3900fc07763.jpg"
            }
        }
    ]);
}

export async function addCharacter(req, res, optionsData, userId)
{
    var result = await db.execute({
        sql: "insert into character(name, link, guest, owner, coin) values(?, ?, ?, ?, ?)",
        args: [optionsData["name"], optionsData["link"], optionsData["guest"] ? 1: 0, userId, optionsData["coin"] != null ? optionsData["coin"]: 0]
    })
    await ensureActiveCharacter(userId, req.body.channel_id);
    return DiscordEmbedResponse(res, req, [{
        title: "เพิ่มตัวละครแล้ว",
        description: "ตัวละคร " + optionsData["name"] + " ถูกเพิ่มโดยมี ID " + result.lastInsertRowid,
        color: embed.embedColor(),
        thumbnail: {
            url: "https://img5.pic.in.th/file/secure-sv1/218551-fantasy_art-concept_art-Guild_Wars-video_games-1.jpg"
        }
    }]);
};

export async function dmWorkweekButton(req, res, optionsData, characterId, userId)
{
    var message = "";
    if(activeWorkweekModification[userId] != null && activeWorkweekModification[userId] > 0)
    {
        var result = await db.execute({
            sql: "update character set workweek = workweek + ? where id = ?",
            args: [activeWorkweekModification[userId], characterId]
        })
        message = "อัพเดท!\n";

        delete activeWorkweekModification[userId];
    }

    var result = await db.execute({
        sql: "select * from character where id = ?",
        args: [characterId]
    })
    message += "Workweek ของ " + result.name + " คือ " + result.workweek;
    return DiscordUpdateTextResponse(res, message);
}

export async function sync(req, res, optionsData, userId)
{
    
}

export async function dmWorkweek(req, res, optionsData, userId)
{
    var result = await db.execute("select * from character");
    var deleteOptions = [];
    if(result.length > 0)
    {
        result.forEach(x =>
        {
            deleteOptions.push({
                label: x.name + (x.current > 0 ? "✅": ""),
                value: x.id
            })
        }
        );
        activeWorkweekModification[userId] = optionsData["add"];
        return DiscordSelectionBoxResponse(res, deleteOptions, "workweek_char", "Select character");
    }
    else
    {
        return DiscordTextResponse(res, "ไม่มีตัวละครในฐานข้อมูล");
    }
}

export async function switchCharacterButton(req, res, userId, characterId)
{
    var output = "Character ID " + characterId;
    var result = await db.execute({
        sql: "update character set current = 0 where owner = ?",
        args: [userId]
    });

    result = (await db.execute({
        sql: "update character set current = 1 where id = ?",
        args: [characterId]
    }));
    var change = result.changes;
    await ensureActiveCharacter(userId, req.body.channel_id);

    result = (await db.execute({
        sql: "select * from character where id = ?",
        args: [characterId]
    })).rows[0];
    var message = "เปลี่ยนตัวละครเป็น " + result.name;
    DiscordRequest('channels/' + req.body.channel_id + "/messages", { method: 'POST', body: { embeds: [
        {
            title: "สลับตัวละครแล้ว",
            description: message,
            thumbnail:{
                url: "https://img5.pic.in.th/file/secure-sv1/allies.webp"
            }
        }
    ]}});
    
    return DiscordUpdateTextResponse(res, "กำลังสลับตัวละคร...");
}

export async function switchCharacter(req, res, userId)
{
    console.log(userId);
    var result = (await db.execute({
        sql: "select * from character where owner = ?",
        args: [userId]
    })).rows;
    var deleteOptions = [];
    if(result.length > 0)
    {
        result.forEach(x =>
        {
            deleteOptions.push({
                label: x.name + (x.current > 0 ? "✅": ""),
                value: x.id
            })
        }
        );
        return DiscordSelectionBoxResponse(res, deleteOptions, 'switch_char_' + userId, "Select character");
    }
    else
    {
        return DiscordTextResponse(res, "คุณไม่มีตัวละครอยู่");
    }
}

export async function removeCharacterButton(req, res, optionsData, userId, characterId)
{
    var output = "Character ID " + characterId;
    var result = (await db.execute({
        sql: "delete from character where id = ?",
        args: [characterId]
    })).rowsAffected;
    await ensureActiveCharacter(userId, req.body.channel_id);
    var message;
    if(result > 0)
    {
        message = output + " ถูกลบแล้ว";
        DiscordRequest('channels/' + req.body.channel_id + "/messages", { method: 'POST', body: { embeds: [
            {
                title: "ลาก่อน",
                description: message,
                thumbnail: {
                    url: "https://img5.pic.in.th/file/secure-sv1/imagee388ea591db637d0.jpg"
                }
            }
        ]}});
    }
    else
    {
        message = "หา " + output + " ไม่เจอ";
        DiscordRequest('channels/' + req.body.channel_id + "/messages", { method: 'POST', body: { content: "<@" + userId + ">. " + message }});
    }
    
    return DiscordUpdateTextResponse(res, "ตัวละคร ID " + characterId + " กำลังถูกลบ");
}

export async function removeCharacter(req, res, optionsData, userId)
{
    var queryString = "select * from character ";
    if (userId != null)
    {
        queryString += "where owner = ?";
    }
    var args = [];
    if(userId != null)
        args.push(userId);

    var result = (await db.execute({
        sql: queryString,
        args: args
    })).rows;
    var deleteOptions = [];
    if(result.length > 0)
    {
        result.forEach(x =>
        {
            deleteOptions.push({
                label: x.name,
                value: x.id
            })
        });
        return DiscordSelectionBoxResponse(res, deleteOptions, "delete_char_" + userId, "Select character to delete");
    }
    else
    {
        return DiscordTextResponse(res, "ไม่มีตัวละครให้ลบ");
    }
}

export async function listCharacter(req, res, optionsData, userId)
{
    var queryString = "select * from character ";
    if(userId != null)
    {
        queryString += " where owner = ?";
    }
    var args = [];
    if(userId != null)
        args.push(userId);
    var result = (await db.execute({
        sql: queryString,
        args: args
    })).rows;
    
    if(result != null && result.length > 0)
    {
        var content = {
            title: "Character's List",
            fields: [],
            color: embed.embedColor()
        };
        result.forEach( x=>
        {
            content.fields.push({
                name: x.name,
                value: "ID: " + x.id + " " + x.coin.toFixed(2) + " gp\n" + x.link + "\n" +(x.current > 0 ? "\t✅": "")
            });
        });
        return DiscordEmbedResponse(res, req, [content]);
    }
    else
    {
        return DiscordTextResponse(res, "No characters in database");
    }
}

async function ensureActiveCharacter(userId, channelId)
{
    var result = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows;
    
    if(result != null && result.length > 0)
        return;

    await db.execute({
        sql: "update character set current = 1 where id = (select min(id) from character where owner = ?)",
        args: [userId]
    });
    
    result = (await db.exeucte({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows;
    if(result != null && result.length > 0)
    {
        await DiscordRequest('channels/' + channelId + "/messages", { method: 'POST', body: { content: "<@" + userId + ">. ตัวละครปัจจุบันคือ " + result[0].name}});
    }
}