import * as embeds from "./embeds.js";
import {db} from "@/database/database.js";
import * as utils from "@/utils.js"
import {waitUntil} from "@vercel/functions"

export async function remove(res, req, optionsData, userId)
{
    await db.execute({
        sql: "delete from event where head = ?",
        args: [optionsData.head]
    });

    return utils.DiscordSelfTextResponse(res, `ลบข่าว ${optionsData.head} แล้ว`);
}
export async function add(res, req, optionsData, userId, attachments)
{ 
    var count = (await db.execute("select head from event")).rows.length;

    if(count >= 16)
        return utils.DiscordSelfTextResponse(res, "❌ สัปดาห์นี้มีเหตุการณ์เยอะแล้ว เพิ่มอีกไม่ได้");

    var out = utils.DiscordSelfTextResponse(res, `✅ เพิ่มเหตุการณ์ ${optionsData.head} แล้ว`);

    waitUntil((async ()=>
    {
        var sql = ["head", "body", "date", "user"];
        var q = ["?", "?", "?", "?"];
        var args = [optionsData.head, optionsData.body, Date.now(), userId];
        
        if(optionsData.image)
        {
            const res = await fetch(attachments[optionsData.image].url);
            const arrayBuffer = await res.arrayBuffer();
            
            const bytes = new Uint8Array(arrayBuffer);

            sql.push("image");
            sql.push("image_type")
            q.push("?");
            q.push("?");
            args.push(bytes);
            args.push(attachments[optionsData.image].content_type);
        }

        await db.execute({
            sql: `insert into event (${ sql.join(',') }) values(${q.join(',')})`,
            args: args
        });
    })());
    
    return out;
}
export async function tick(attachments, files)
{
    var outgoing = [];
    var rows = (await db.execute("select * from event")).rows;
    var i = 0;
    rows.forEach(row =>
    {
        if(row.image)
        {
            attachments.push({id: i, filename: `image[${i}].png`});
            files.push({name: `image${i}.png`, data: row.image, contentType: row.image_type})
            outgoing.push({
                title: row.head,
                description: row.body,
                color:embeds.embedColor(),
                thumbnail: {
                    url: `attachment://image[${i}].png`
                }
            });
            i++;
        }
        else
        {
            outgoing.push({
                title: row.head,
                description: row.body,
                color:embeds.embedColor()
            })
        }
    });
    await db.execute("delete from event");

    return outgoing;
}