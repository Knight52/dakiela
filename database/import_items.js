import {DatabaseSync} from "node:sqlite";
import {readFile} from "fs/promises";
import { databasePath } from "../constants";

var jsonPath = process.argv[2];
readFile(jsonPath, "utf8").then(value =>
{
    var json = JSON.parse(value);
    var database = new DatabaseSync(databasePath);
    var i = 0;
    var arr = null;
    if(json.item != null)
    {
        arr = json.item;
    }
    if(json.baseitem != null)
    {
        arr = json.baseitem;
    }
    arr.forEach(x =>
    {
        if(x.source == "XDMG" || x.source == "XPHB")
        {
            console.log("Importing " + x.name + " from " + x.source);
            var query = database.prepare("insert into item (name, price, weight, consumable) values (?, ?, ?, ?)");
            query.run(x.name, x.value ? x.value / 100: 0, x.weight ? x.weight: 0, (x.type == "P|XPHB" || x.type == "P") ? 1: 0);
            i++;
        }
    });
    console.log("Imported " + i + " items!");
    database.close();
});