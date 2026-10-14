import * as utils from '../utils.js'
import * as embeds from "../commands/embeds.js";
import {
  InteractionResponseFlags,
} from 'discord-interactions';
import {db} from "@/database/database.js";
import { timezoneDiffTick } from '@/constants.js';

export const button_id_prefix = 'workweek_tick_';
export async function click(res, req, button_id, userId)
{
    var result = (await db.execute({
        sql: "select * from workweek_click where button_id = ? and character = -1",
        args: [button_id]
    })).rows;

    if(result.length == 0)
        return utils.DiscordTextResponse(res, "Invalid workweek button id: " + button_id);

    result = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(result == null)
        return utils.DiscordTextResponse(res, "ไม่มีตัวละคร");
    if(result.coin < 10)
        return utils.DiscordTextResponse(res, "ไม่มีเงินจ่ายค่า workweek");
    if(result.workweek >= 3)
        return utils.DiscordTextResponse(res, "มี workweek เต็มแล้ว");

    var r = (await db.execute({
        sql: "select * from workweek_click where button_id = ? and character = ?",
        args: [button_id, result.id]
    })).rows;

    if(r.length > 0)
        return utils.DiscordTextResponse(res, "คุณกด workweek สำหรับตัวละครนี้ไปแล้ว");

    await db.execute({
        sql: "update character set workweek = workweek + 1, coin = coin-10 where id = ? and workweek < 3",
        args: [result.id]
    })

    result = (await db.execute({
        sql: "select * from character where id = ?",
        args: [result.id]
    })).rows[0];

    await db.execute({
        sql: "insert into workweek_click (button_id, character) values (?, ?)",
        args: [button_id, result.id]
    });

    var c = await embeds.coinEmbed(result.id, -10, result.name + " ตอนนี้มี " + result.workweek + " workweeks.");

    return utils.DiscordEmbedResponse(res, req, [c]);
}
export async function tick()
{
    return {
            title: "Upkeep Time!!",
            description: "ได้เวลาจ่ายค่ากินอยู่จำนวน 10 gp ของสัปดาห์ที่ " + (new Date(Date.now() + timezoneDiffTick)).toLocaleDateString("th-TH", { month: "long", day: "numeric", year: "numeric"}) + " แล้วจ้า!\n\n(กด !ww เพื่อรับ workweek)",
            image:
            {
                url: "https://i.ibb.co/1fKg57M4/Gemini-Generated-Image-ppub2ppub2ppub2p.png"
            },
            color: 0xFFFFFF
        };
}