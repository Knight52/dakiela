import { getRandomEmoji, DiscordRequest, DiscordTextResponse, DiscordUpdateTextResponse, DiscordSelectionBoxResponse, DiscordEmbedResponse, DiscordUpdateEmbedResponse } from '../utils.js';
import * as embeds from "./embeds.js";
import { MessageComponentTypes } from "discord-interactions";
import {db} from "@/database/database.js";

export const inventoryPrefix = {
    edit: "inventory_edit_",
    exit: "inventory_exit_",
    select_up: "inventory_select_up_",
    select_down: "inventory_select_down_",
    move_up: "inventory_move_up_",
    move_down: "inventory_move_down_",
    remove_one: "inventory_remove_one_",
    remove_five: "inventory_remove_five_",
    sell_one: "inventory_sell_one_",
    sell_five: "inventory_sell_five_",
    add_one: "inventory_add_one_",
    add_five: "inventory_add_five_",
    buy_one: "inventory_buy_one_",
    buy_five: "inventory_buy_five_"
};
export async function addFromInventory(res, req, optionsData, userId, amount, buy)
{
    var result = (await db.execute({
        sql: "\
        select inventory.*, \
            character.id as characterid, \
            character.owner as owner, \
            character.coin as coin, \
            item.price as price \
        from inventory \
            inner join character on inventory.character = character.id \
            left join item on item.name = inventory.item_name \
        where inventory.selecting = 1 and owner = ?",
        args: [userId]
    })).rows[0];

    if(result.price != null && buy)
    {
        while(result.price * amount > result.coin)
        {
            amount--;
        }

        await db.execute({
            sql: "update character set coin = coin - ? where id = ?",
            args: [result.price * amount, result.characterid]
        })
    }

    await db.execute({
        sql: "update inventory set amount = ? where character = ? and item_name = ?",
        args: [result.amount + amount, result.characterid, result.item_name]
    })

    return await editInventory(res, req, optionsData, userId);
}
export async function removeFromInventory(res, req, optionsData, userId, amount, sell)
{
    var result = (await db.execute({
        sql: "\
        select inventory.*, \
            character.id as characterid, \
            character.owner as owner, \
            character.coin as coin, \
            item.price as price \
        from inventory \
            inner join character on inventory.character = character.id \
            left join item on item.name = inventory.item_name \
        where inventory.selecting = 1 and owner = ?",
        args: [userId]
    })).rows[0];

    while(amount > result.amount)
        amount--;

    if(sell)
    {
        await db.execute({
            sql: "update character set coin = coin + ? where id = ?",
            args: [result.price / 2 * amount, result.characterid]
        });
    }

    if(amount >= result.amount)
    {
        await db.execute({
            sql: "delete from inventory where item_name = ? and character = ?",
            args: [result.item_name, result.characterid]
        });

        await ensureItemSelection(result.characterid);
    }
    else
    {
        await db.execute({
            sql: "update inventory set amount = amount - ? where item_name = ? and character = ?",
            args: [amount, result.item_name, result.characterid]
        });
    }
    
    return await editInventory(res, req, optionsData, userId);
}
export async function remove(res, req, optionsData, userId, sell)
{
    var amount = 1;
    if(optionsData.amount != null)
        amount = optionsData["amount"];

    var characterId = null;
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(playerInfo == null)
    {
        return DiscordTextResponse(res, "User ID ไม่ถูกต้องหรือไม่มีตัวละครอยู่");
    }
    characterId = playerInfo.id;

    var result = (await db.execute({
        sql: "select * from item where lower(name) = ?",
        args: [optionsData.name.toLowerCase()]
    })).rows[0];
    
    var inventory = (await db.execute({
        sql: "select amount, price from inventory where lower(item_name) = ? and character = ?",
        args: [optionsData.name.toLowerCase(), characterId]
    })).rows[0];

    var goldGained = 0;

    if(inventory.amount < amount)
    {
        amount = inventory.amount;
    }
    if(result != null || inventory.price != null)
    {
        if(sell)
        {
            goldGained = (inventory.price ? inventory.price : result.price)/2 * amount;
            await db.execute({
                sql: "update character set coin = coin + ? where id = ?",
                args: [goldGained, characterId]
            });
        }  
    }

    result = (await db.execute({
        sql: "update inventory set amount = amount - ? where lower(item_name) = ? and character = ?",
        args: [amount, optionsData.name.toLowerCase(), characterId]
    })).rows[0];

    await db.execute({
        sql: "delete from inventory where amount = 0 and character = ?",
        args: [characterId]
    });

    await ensureItemSelection(characterId);

    if(optionsData.sell)
    {
        var embed = await embeds.coinEmbed(characterId, goldGained, amount + " " + optionsData.name + " ถูกขายแล้ว!", "https://img2.pic.in.th/v66j0ykd92a51.jpg")
        return DiscordEmbedResponse(res, req, [ embed ]);
    }
    else
    {
        return DiscordEmbedResponse(res, req, [{
            description: amount + " " + optionsData.name + " ถูกนำออกจากกระเป๋าแล้ว",
            thumbnail: { url: "https://img2.pic.in.th/v66j0ykd92a51.jpg" },
            title: "สำเร็จ!"
        }]);
    }
}
export async function add(res, req, optionsData, userId, buy)
{
    var amount = 1;
    if(optionsData.amount != null)
        amount = optionsData["amount"];
    if(optionsData.price && optionsData.price < 0)
        optionsData.price = 0;
    if(optionsData.weight && optionsData.weight < 0)
        optionsData.weight = 0;

    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(playerInfo == null)
    {
        return DiscordTextResponse(res, "User ID ไม่ถูกต้องหรือไม่มีตัวละครอยู่");
    }
    var characterId = playerInfo.id;

    var itemId = null;
    var result = (await db.execute({
        sql: "select * from item where lower(name) = ?",
        args: [optionsData.item.toLowerCase()]
    })).rows[0];

    var r = (await db.execute({
        sql: "select * from inventory where lower(item_name) = ? and character = ?",
        args: [optionsData.item.toLowerCase(), characterId]
    })).rows[0];

    var price = 0;

    if(result != null || optionsData.price || (r != null && r.price != null))
    {
        if(buy)
        {
            var pricePerUnit = 0;
            if(result != null)
                pricePerUnit = result.price;
            if(optionsData.price)
                pricePerUnit = optionsData.price;
            if(r != null)
                pricePerUnit = r.price;

            price = pricePerUnit * amount;

            if(price > 0 && playerInfo.coin < price)
            {
                return DiscordTextResponse(res, "❌ ไม่มีเงินพอที่จะซื้อ " + optionsData.item);
            }
            await db.execute({
                sql: "update character set coin = coin - ? where id = ?",
                args: [price, characterId]
            });
        }  
        if(result != null)
            itemId = result.id;
    }

    if(!optionsData.price)
        optionsData.price = null;

    if(!optionsData.weight)
        optionsData.weight = null;

    await db.execute({
        sql: 'insert or ignore into inventory (item_id, character, item_name, amount, price, weight) values (?, ?, ?, 0, ?, ?)',
        args: [itemId, characterId, optionsData.item, optionsData.price, optionsData.weight]
    });

    await db.execute({
        sql: "update inventory set amount = amount + ? where item_name = ? and character = ?",
        args: [amount, optionsData.item, characterId]
    });
    
    await ensureItemSelection(characterId);

    if(buy)
    {
        var embed = await embeds.coinEmbed(characterId, -price, "ซื้อ " + amount + "x " + optionsData.item + " แล้ว!", "https://img2.pic.in.th/v66j0ykd92a51.jpg")
        return DiscordEmbedResponse(res, req, [ embed ]);
    }
    else
    {
        return DiscordEmbedResponse(res, req, [{
            description: amount + " " + optionsData.item + " ถูกเพิ่มเข้าไปในกระเป๋าแล้ว!",
            thumbnail: { url: "https://img2.pic.in.th/v66j0ykd92a51.jpg" },
            title: "Success!"
        }]);
    }
}
export async function list(res, req, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(playerInfo == null)
    {
        return DiscordTextResponse(res, "หา user ID " + userId + " ไม่เจอ");
    }
    
    var e = [await embeds.itemEmbed(playerInfo, false)];

    var components = [
        {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "จัดการ",
                    custom_id: inventoryPrefix.edit + userId,
                    style: 2
                },
            ]
        }
    ];

    return DiscordEmbedResponse(res, req, e, components, null);
}
export async function exitInventory(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(playerInfo == null)
    {
        return DiscordTextResponse(res, "หา user ID " + userId + " ไม่เจอ");
    }
    
    var e = [await embeds.itemEmbed(playerInfo, false)];

    var components = [
        {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "จัดการ",
                    custom_id: inventoryPrefix.edit + userId,
                    style: 2
                },
            ]
        }
    ];

    return DiscordUpdateEmbedResponse(res, req, e, components);
}
export async function moveSelectionUp(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    var inventories = (await db.execute({
        sql: "select *, rowid as rowid from inventory where character = ? order by rowid",
        args: [playerInfo.id]
    })).rows;

    var index = -1;
    inventories.forEach(x =>
    {
        if(x.selecting)
            index = inventories.indexOf(x);
    });

    await db.execute({
        sql: "update inventory set selecting = 0 where character = ?",
        args: [playerInfo.id]
    });

    var newRowId = inventories[index-1].rowid;

    await db.execute({
        sql: "update inventory set selecting = 1 where rowid = ?",
        args: [newRowId]
    });

    return await editInventory(res, req, optionsData, userId);
}
export async function moveSelectionDown(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    var inventories = (await db.execute({
        sql: "select *, rowid as rowid from inventory where character = ? order by rowid",
        args: [playerInfo.id]
    })).rows;

    var index = -1;
    inventories.forEach(x =>
    {
        if(x.selecting)
            index = inventories.indexOf(x);
    });

    await db.execute({
        sql: "update inventory set selecting = 0 where character = ?",
        args: [playerInfo.id]
    });

    var newRowId = inventories[index+1].rowid;

    await db.execute({
        sql: "update inventory set selecting = 1 where rowid = ?",
        args: [newRowId]
    });

    return await editInventory(res, req, optionsData, userId);
}
export async function moveItemUp(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    var inventories = (await db.execute({
        sql: "select *, rowid as rowid from inventory where character = ? order by rowid",
        args: [playerInfo.id]
    })).rows;

    var index = -1;
    inventories.forEach(x =>
    {
        if(x.selecting)
            index = inventories.indexOf(x);
    });

    await db.execute({
        sql: "update inventory set character = -1 where rowid = ?",
        args: [inventories[index].rowid]
    });

    await db.execute({
        sql: "update inventory set item_id = ?, character = ?, item_name = ?, amount = ?, selecting = 1 where inventory.rowid = ?",
        args: [inventories[index].item_id, playerInfo.id, inventories[index].item_name, inventories[index].amount, inventories[index-1].rowid]
    });

    await db.execute({
        sql: "update inventory set item_id = ?, character = ?, item_name = ?, amount = ?, selecting = 0 where inventory.rowid = ?",
        args: [inventories[index-1].item_id, playerInfo.id, inventories[index-1].item_name, inventories[index-1].amount, inventories[index].rowid]
    });

    return await editInventory(res, req, optionsData, userId);
}
export async function moveItemDown(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    var inventories = (await db.execute({
        sql: "select *, rowid as rowid from inventory where character = ? order by rowid",
        args: [playerInfo.id]
    })).rows;
    var index = -1;
    inventories.forEach(x =>
    {
        if(x.selecting)
            index = inventories.indexOf(x);
    });

    await db.execute({
        sql: "update inventory set character = -1 where rowid = ?",
        args: [inventories[index].rowid]
    });

    await db.execute({
        sql: "update inventory set item_id = ?, character = ?, item_name = ?, amount = ?, selecting = 1 where rowid = ?",
        args: [inventories[index].item_id, playerInfo.id, inventories[index].item_name, inventories[index].amount, inventories[index+1].rowid]
    });

    await db.execute({
        sql: "update inventory set item_id = ?, character = ?, item_name = ?, amount = ?, selecting = 0 where rowid = ?",
        args: [inventories[index+1].item_id, playerInfo.id, inventories[index+1].item_name, inventories[index+1].amount, inventories[index].rowid]
    });

    return await editInventory(res, req, optionsData, userId);
}
export async function editInventory(res, req, optionsData, userId)
{
    var playerInfo = (await db.execute({
        sql: "select * from character where owner = ? and current = 1",
        args: [userId]
    })).rows[0];

    if(playerInfo == null)
    {
        return DiscordTextResponse(res, "หา user ID " + userId + " ไม่เจอ");
    }

    var inventories = (await db.execute({
        sql: "select *, rowid as rowid from inventory where character = ? order by rowid",
        args: [playerInfo.id]
    })).rows;
    var first = false;
    var last = false;
    inventories.forEach(x =>
    {
        if(x.selecting && inventories.indexOf(x) == 0)
            first = true;
        if(x.selecting && inventories.indexOf(x) == inventories.length - 1)
            last = true;
    });
    
    var e = [await embeds.itemEmbed(playerInfo, true)];

    var currentItem = (await db.execute({
        sql: 
            "select inventory.*, item.*, character.coin as coin from inventory \
                left join item on inventory.item_id = item.id \
                inner join character on character.id = inventory.character \
            where character = ? and selecting = 1",
        args: [playerInfo.id]
    })).rows[0];

    var components = [
        {
            type: MessageComponentTypes.ACTION_ROW,
            "components":[
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "เลือกขึ้น",
                    custom_id: inventoryPrefix.select_up + userId,
                    style: 2,
                    disabled: first || inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "เลือกลง",
                    custom_id: inventoryPrefix.select_down + userId,
                    style: 2,
                    disabled: last || inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "อัพเดท",
                    custom_id: inventoryPrefix.edit + userId,
                    style: 2
                }
            ]
        },
        {
            type: MessageComponentTypes.ACTION_ROW,
            "components":[
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "สลับขึ้น",
                    custom_id: inventoryPrefix.move_up + userId,
                    style: 1,
                    disabled: first || inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "สลับลง",
                    custom_id: inventoryPrefix.move_down + userId,
                    style: 1,
                    disabled: last || inventories.length == 0
                }
            ]
        },
        {
            type:MessageComponentTypes.ACTION_ROW,
            "components": [
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "เพิ่ม 1",
                    custom_id: inventoryPrefix.add_one + userId,
                    style: 1,
                    disabled: inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "เพิ่ม 5",
                    custom_id: inventoryPrefix.add_five + userId,
                    style: 1,
                    disabled: inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "ซื้อ 1",
                    custom_id: inventoryPrefix.buy_one + userId,
                    style: 1,
                    disabled: currentItem == null ||(currentItem.price == 0 || currentItem.price == null) || (currentItem.price > currentItem.coin) || inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "ซื้อ 5",
                    custom_id: inventoryPrefix.buy_five + userId,
                    style: 1,
                    disabled: currentItem == null || (currentItem.price == 0 || currentItem.price == null) || (currentItem.price * 5 > currentItem.coin) || inventories.length == 0
                }]
        },
        {
            type: MessageComponentTypes.ACTION_ROW,
            "components": [
                {
                    type:MessageComponentTypes.BUTTON,
                    label: "ลบ 1",
                    custom_id: inventoryPrefix.remove_one + userId,
                    style: 1,
                    disabled: inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "ลบ 5",
                    custom_id: inventoryPrefix.remove_five + userId,
                    style: 1,
                    disabled: inventories.length == 0
                },
                {
                    type:MessageComponentTypes.BUTTON,
                    label: "ขาย 1",
                    custom_id: inventoryPrefix.sell_one + userId,
                    style: 1,
                    disabled: currentItem == null || currentItem.price == 0 || currentItem.price == null || inventories.length == 0
                },
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "ขาย 5",
                    custom_id: inventoryPrefix.sell_five + userId,
                    style: 1,
                    disabled: currentItem == null || (currentItem.price == 0 || currentItem.price == null) || inventories.length == 0
                }
            ]
        },
        {
            type: MessageComponentTypes.ACTION_ROW,
            "components": [
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "เรียบร้อย",
                    custom_id: inventoryPrefix.exit + userId,
                    style: 1
                },
            ]
        },
    ];

    return DiscordUpdateEmbedResponse(res, req, e, components, true);
}
async function ensureItemSelection(characterId)
{
    var result = (await db.execute({
        sql: "select * from inventory where character = ? and selecting = 1",
        args: [characterId]
    })).rows;
    
    if(result != null && result.length > 0)
        return;

    await db.execute({
        sql: "update inventory set selecting = 1 where ROWID in (select ROWID from inventory group by character) and character = ?",
        args: [characterId]
    });
}