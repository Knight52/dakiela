export const config = {
  api: {
    bodyParser: false, // disable Next's auto JSON parsing
  },
};
import { buffer } from 'micro';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKey,
} from 'discord-interactions';
import * as utils from '@/utils.js';
import * as charModule from '@/commands/characters.js';
import * as itemModule from '@/commands/items.js';
import * as etcModule from '@/commands/etc.js';
import * as events from '@/commands/event.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: "unsupported method" });
  }

  const rawBody = await buffer(req);
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];

  const isValid = await verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY);

  if (!isValid) {
    return res.status(401).end('Invalid request signature');
  }

  req.body = JSON.parse(rawBody.toString('utf-8'));
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  const { name } = data;
  
  var userId = req.body.member.user.id;
  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  var optionsData = {};
  if(req.body.data.options != null)
  {
    req.body.data.options.forEach(x =>
    {
      optionsData[x.name] = x.value;
    });
  }
  
  if (type === InteractionType.MESSAGE_COMPONENT)
  {
    const componentId = data.custom_id;
    if(componentId.startsWith("delete_char_"))
    {
      return charModule.removeCharacterButton(req, res, optionsData, userId, data.values[0]);
    }
    if(componentId.startsWith("switch_char_"))
    {
      return charModule.switchCharacterButton(req, res, userId, data.values[0]);
    }
    if(componentId.startsWith("workweek_char"))
    {
      return charModule.dmWorkweekButton(req, res, userId, data.values[0], userId);
    }
    if(componentId.startsWith(workweek.button_id_prefix))
    {
      return workweek.click(res, req, componentId, userId);
    }
    if(utils.VerifyUser(userId, componentId))
    {
      if(componentId.startsWith(itemModule.inventoryPrefix.edit))
      {
        return itemModule.editInventory(res, req, optionsData, userId)
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.exit))
      {
        return itemModule.exitInventory(res, req, optionsData, userId);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.select_up))
      {
        return itemModule.moveSelectionUp(res, req, optionsData, userId);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.select_down))
      {
        return itemModule.moveSelectionDown(res, req, optionsData, userId);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.move_up))
      {
        return itemModule.moveItemUp(res, req, optionsData, userId);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.move_down))
      {
        return itemModule.moveItemDown(res, req, optionsData, userId);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.add_one))
      {
        return itemModule.addFromInventory(res, req, optionsData, userId, 1, false);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.add_five))
      {
        return itemModule.addFromInventory(res, req, optionsData, userId, 5, false);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.buy_one))
      {
        return itemModule.addFromInventory(res, req, optionsData, userId, 1, true);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.buy_five))
      {
        return itemModule.addFromInventory(res, req, optionsData, userId, 5, true);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.remove_one))
      {
        return itemModule.removeFromInventory(res, req, optionsData, userId, 1, false);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.remove_five))
      {
        return itemModule.removeFromInventory(res, req, optionsData, userId, 5, false);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.sell_one))
      {
        return itemModule.removeFromInventory(res, req, optionsData, userId, 1, true);
      }
      if(componentId.startsWith(itemModule.inventoryPrefix.sell_five))
      {
        return itemModule.removeFromInventory(res, req, optionsData, userId, 5, true);
      }
    }
    else
    {
      return utils.DiscordTextResponse(res, "นี่ไม่ใช่ช่องใส่ของของคุณ");
    }
  }
  
  if (type === InteractionType.APPLICATION_COMMAND) 
  {
    if(name === 'addevent')
    {
      return await events.add(res, req, optionsData, userId, data.resolved?.attachments);
    }
    if(name === 'removeevent')
    {
      return await events.remove(res, req, optionsData, userId);
    }
    if(name === 'sync')
    {
      return charModule.sync(req, res, optionsData, userId);
    }
    if (name === 'removeitem')
    {
      return itemModule.remove(res, req, optionsData, userId, optionsData.sell);
    }
    if (name === 'inventory')
    {
      return itemModule.list(res, req, userId);
    }
    if (name === 'additem')
    {
      return itemModule.add(res, req, optionsData, userId, optionsData.buy);
    }
    if (name === 'workweek')
    {
      return charModule.workweek(req, res, optionsData, userId);
    }
    if (name === 'dmworkweek')
    {
      return charModule.dmWorkweek(req, res, optionsData, userId);
    }
    if (name === 'dmaddchar')
    {
      return charModule.addCharacter(req, res, optionsData, optionsData["owner"]);
    }
    if (name === 'dmremovechar')
    {
      return charModule.removeCharacter(req, res, optionsData, optionsData["owner"]);
    }
    if (name === 'dmlistchar')
    {
      return charModule.listCharacter(req, res, optionsData, optionsData["owner"]);
    }
    if (name === 'switchchar')
    {
      return charModule.switchCharacter(req, res, userId);
    }
    if (name === 'removechar')
    {
      return charModule.removeCharacter(req, res, optionsData, userId);
    }
    if (name === 'listchar')
    {
      return charModule.listCharacter(req, res, optionsData, userId);
    }
    if (name === 'addchar')
    {
      return charModule.addCharacter(req, res, optionsData, userId);
    }
    if (name === 'editchar')
    {
      return charModule.edit(res, req, optionsData, userId);
    }
    if (name === 'coin')
    {
      return charModule.coin(req, res, optionsData, userId);
    }
    if (name === 'config')
    {
      return etcModule.config(res, req, optionsData, userId);
    }
    if (name === 'schedule')
    {
      var task = cron.schedule(optionsData["every"], function () 
      {
        utils.DiscordRequest('channels/' + req.body.channel_id + "/messages", { method: 'POST', body: { content: "<@" + optionsData["role"] + ">. " + optionsData["message"] }});
      });
      if (activeCron[userId] == null)
      {
        activeCron[userId] = [];
      }
      activeCron[userId].push(task);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: "Message scheduled"
            }
          ]
        }
      });
    }
    if(name === 'testembed')
    {
      var response = res.send({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      });
      response.addListener("close", ()=>{
        setTimeout(()=>
        {
          utils.DiscordRequest('webhooks/' + req.body.application_id + "/" + req.body.token + "/messages/@original", 
            {
              method: 'PATCH', 
              headers: { 'Content-Type': 'application/json' },
              body: {
                embeds: [
                  {
                    title: "Hi",
                    description: "desc"
                  }
                ]
              }
            });
        }, 1000);
      });
      return response;
    }
    if (name === 'tick')
    {
      workweek.tick();
      //return cityTick.tick(res);
      return utils.DiscordTextResponse(res, "Finished");
    }

    if (name === 'unschedule')
    {
      if(activeCron[userId] != null)
      {
        activeCron[userId].forEach(x =>
        {
          x.stop();
        });
        activeCron[userId] = [];
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: "Schedule(s) by you cancelled."
            }
          ]
        }
      });
    }
    
    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }
  return res.status(400).json({ error: 'unknown interaction type' });
}
