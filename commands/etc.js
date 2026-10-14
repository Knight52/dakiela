import * as utils from '../utils.js'
import {db} from "@/database/database.js";

export async function config(res, req, optionsData, userId)
{
    var e = [
        {
            title: "Completed.",
            description: ""
        }];
    var result = (await db.execute({
        sql: "select * from configuration where name = ?",
        args: [optionsData.name]
    })).rows[0];

    var channel = result.channel;
    var role =  result.role;
    var cron = result.cron;
    var user = result.user;

    if(optionsData.channel)
        channel = optionsData.channel;
    if(optionsData.role)
        role = optionsData.role;
    if(optionsData.cron)
        cron = optionsData.cron;
    if(optionsData.user)
        user = optionsData.user;

    await db.execute({
        sql: "update configuration set channel = ?, role = ?, cron = ?, user = ? where name = ?",
        args: [channel, role, cron, user, optionsData.name]
    })

    result = (await db.execute({
        sql: "select * from configuration where name = ?",
        args: [optionsData.name]
    })).rows[0];

    e[0].description = "Cron = " + result.cron + " Channel = <#" + result.channel + "> Role = <@&" + result.role + ">";
    return utils.DiscordEmbedResponse(res, req, e, undefined);
}
