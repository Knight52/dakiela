/**
 * @jest-environment node
 */
import { handleGuildTrading, handleGuildAssist, questRoom } from "@/pages/api/tick.js";
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

/*describe("tick.js -> handleGuildTrading", ()=>
{
    test();
});
describe("tick.js -> handleGuildAssist", ()=>
{

});*/
describe("tick.js -> questRoomThreads", ()=>
{
    test("questRoomThread", async()=>
    {
        await questRoom({
            'QUEST_FORUM':{
                channel: "1568096598431637564"
            },
            'REPORT': {
                channel: "1463137184663081045"
            }
        }, Date.now())
    });
});