/**
 * @jest-environment node
 */
import { playerRoomThreads, workweekThread } from "@/pages/api/tick.js";
import {log} from "console"

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
test("Integration test for weekly tick", async () =>
{
    var tradeMultiplier = await workweekThread();
    await playerRoomThreads(tradeMultiplier);
}, 2147483647);