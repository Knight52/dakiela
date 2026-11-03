/**
 * @jest-environment node
 */
import { handleGuildTrading, handleGuildAssist } from "@/pages/api/tick.js";
import {log} from "console"
import * as fs from "node:fs"

/*test("System Test for playerRoomThreads()", async ()=>
{
    //log(await playerRoomThreads(1.5));
    expect(2).toBe(2);
}, 2147483647);
test("System Test for workweekThread()", async () =>
{
    //await workweekThread();
    expect(2).toBe(2);
}, 2147483647);*/
/*test("Integration test for weekly tick", async () =>
{
    var tradeMultiplier = await workweekThread();
    await playerRoomThreads(tradeMultiplier);
}, 2147483647);*/

const fiona = JSON.parse(fs.readFileSync("./fiona.json", "utf-8"));
const tim = JSON.parse(fs.readFileSync("./tim.json", "utf-8"));
const calia = JSON.parse(fs.readFileSync("./calia.json", "utf-8"));

describe("tick.js -> handleGuildTrading", ()=>
{
    test();
});
describe("tick.js -> handleGuildAssist", ()=>
{

});