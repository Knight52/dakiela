import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import "dotenv/config"

export function TimeTextToTick(time)
{
  return new Date(time).getTime();
}
export function DiscordTextTableResponse(res, text)
{
  var components = [];
  text.forEach(x =>
  {
    var column = [];
    x.forEach(y =>
    {
      column.push(y);
    });
    components.push({
      type: MessageComponentTypes.TEXT_DISPLAY,
      content: column.join('s')
    });
  });
  console.log(components);
  return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              "components":[
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  "components": components
                }
              ]
          },
      });
}
export function DiscordUpdateEmbedResponse(res, req, embeds, components = undefined)
{
  return res.send({
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: {
      flags: InteractionResponseType.IS_COMPONENTS_V2,
      "embeds": embeds,
      "components": components
    }
  });
}
export async function DiscordEmbedResponse(res, req, embeds, components = undefined, func = null)
{
  if(func != null)
  {
    await func();
  }
  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: embeds,
      components: components
    }
  })
}
export function VerifyUser(userId, customId)
{
  return customId.indexOf(userId) >= 0;
}
export function DiscordSelfTextResponse(res, msg){
  return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
              flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                  {
                      type: MessageComponentTypes.TEXT_DISPLAY,
                      content: msg
                  }
              ]
          },
      });;
}
export function DiscordTextResponse(res, msg){
  return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                  {
                      type: MessageComponentTypes.TEXT_DISPLAY,
                      content: msg
                  }
              ]
          },
      });;
}
export function DiscordUpdateTextResponse(res, msg)
{
  return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                  {
                      type: MessageComponentTypes.TEXT_DISPLAY,
                      content: msg,
                  }
              ]
          },
      });
}
export function DiscordSelectionBoxResponse(res, list, custom_id, msg)
{
  return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                // Indicates it'll be an ephemeral message
                flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                components: [
                    {
                        type: MessageComponentTypes.TEXT_DISPLAY,
                        content: msg,
                    },
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.STRING_SELECT,
                                // Append game ID
                                custom_id: custom_id,
                                options: list,
                            },
                        ],
                    },
                ],
            },
        });
}
export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;

  let headers = {
    Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  };
  let body = options.body;

  if (options.files && options.files.length > 0) {
    // Multipart path: build FormData, let fetch set the Content-Type (with boundary) itself
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(options.body || {}));

    options.files.forEach((file, index) => {
      // file: { name: string, data: Uint8Array/Buffer, contentType?: string }
      formData.append(
        `files[${index}]`,
        new Blob([file.data], { type: file.contentType || 'application/octet-stream' }),
        file.name
      );
    });

    body = formData;
    // do NOT set Content-Type manually — fetch will set the correct multipart boundary
  } else {
    // Existing JSON path
    headers['Content-Type'] = 'application/json';
    if (body) body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    headers,
    ...options,
    body, // override options.body since we may have transformed it above
  });

  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }

  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
