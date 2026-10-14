import {db} from "@/database/database.js";
export async function coinEmbed(characterId, changes, title, thumbnail = "https://img5.pic.in.th/file/secure-sv1/Golde303e08372af147c.th.jpg")
{
    console.log(db);
    var result = (await db.execute({
        sql: "select * from character where id = ?",
        args: [characterId]
    })).rows[0];

    if(changes > 0)
        changes = "(+" + changes + ")";
    else if(changes < 0)
        changes = "(" + changes + ")";
    else
        changes = "";
    var content = {};
    var total = Number(result.coin).toFixed(2);
    var gp = total.substring(0, total.length - 3);
    var sp = total.substring(total.length - 2, total.length - 1);
    var cp = total.substring(total.length - 1);
    content.color = embedColor();
    content.thumbnail = {
        url: thumbnail
    }
    content.title = "กระเป๋าตังค์ของ " + title != null ? title: result.name;
    content.fields = [
        {
            name: "",
            value: ":yellow_circle: " + gp + " gp\n:white_circle: " + sp + " sp\n:orange_circle: " + cp + " cp ",
            inline: true
        },
        {
            name: "มูลค่ารวม",
            value: ":coin:" + total + "gp " + changes
        }
    ];
    return content;
}
export async function itemEmbed(playerInfo, selectMode)
{
    var result = (await db.execute({
        sql: "select *, inventory.price as itemprice, inventory.weight as itemweight from inventory left join item on inventory.item_id = item.id where inventory.character == ? order by inventory.rowid",
        args: [playerInfo.id]
    })).rows;

    var weight = 0;
    var value = 0;
    var fields = [{name: "รายชื่อ", value: "" }, {name: "น้ำหนักรวม", value: ""}, {name: "มูลค่ารวม", value: ""}, { name: "เงินที่มี", value: playerInfo.coin.toFixed(2) + " gp"}];
    result.forEach(x =>
    {
        var w = null;
        if(x.itemweight != null)
        {
            w = " " + x.itemweight + "lb ";
            weight += x.itemweight * x.amount;
        }
        else if(x.weight != null)
        {
            w = " " + x.weight + "lb ";
            weight += x.weight * x.amount;
        }
        else
        {
            w = "";
        }
        var p = null;
        if(x.itemprice != null)
        {
            p = Intl.NumberFormat("en-US", {maximumSignificantDigits: 3}).format(x.itemprice) + "gp "
            value += x.itemprice * x.amount;
        }
        else if(x.price != null)
        {
            p = Intl.NumberFormat("en-US", {maximumSignificantDigits: 3}).format(x.price) + "gp "
            value += x.price * x.amount;
        }
        else
        {
            p = "";
        }

        if(selectMode && x.selecting == 1)
        {
            fields[0].value += "**__" + x.amount + " " + x.item_name + w + p + "__** 🔴\n";
        }
        else
        {
            fields[0].value += x.amount + " " + x.item_name + w + p + "\n";
        }
    });

    fields[1].value = weight + " lb";
    fields[2].value = value.toFixed(2) + " gp";

    return {
        title: "ของในกระเป๋าของ " + playerInfo.name,
        color: embedColor(),
        thumbnail: {
            url: "https://img5.pic.in.th/file/secure-sv1/backpack.jpg"
        },
        "fields": fields
    };
}
export function embedColor()
{
    return (Math.floor(Math.random() * 16777215));
}