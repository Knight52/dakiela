/**
 * @jest-environment node
 */
import * as eventModule from "@/commands/event"
import {db} from "@/database/database.js"

test("Event with no record", async() =>
{
    expect(await eventModule.tick()).toStrictEqual([]);
});