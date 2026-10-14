import * as workweek from "@/ticks/workweek.js";
import * as weeklyEvent from "@/ticks/weeklyevent.js";
import * as utils from "@/utils.js";
import * as event from "@/commands/event.js";
import {db} from "@/database/database.js";
import { oneWeekTick, oneHourTick, timezoneDiffTick } from "@/constants";

export default async function handler(req, res)
{
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).end('Unauthorized');
    }
    
    let tradeMultiplier = await workweekThread();
    await playerRoomThreads(tradeMultiplier);

    res.status(200).json({ name: "Tick complete!" });
}

export async function playerRoomThreads(guildTradingMultiplier)
{
  var forum = (await db.execute("select * from configuration where name = 'PLAYER_FORUM'")).rows[0].channel;
  var avrae = (await db.execute("select user from configuration where name = 'AVRAE'")).rows[0].user;
  var report = (await db.execute("select channel from configuration where name = 'REPORT'")).rows[0].channel;

  var channelInfo = await utils.DiscordRequest(`channels/${forum}`, { method: 'GET' });

  channelInfo = await channelInfo.json();

  var activeThreads = await utils.DiscordRequest(`guilds/${channelInfo.guild_id}/threads/active`, { method: 'GET' });
  activeThreads = await activeThreads.json()

  var allThreads = activeThreads.threads.filter(x => x.parent_id == forum);

  var archivedThreads = await utils.DiscordRequest(`channels/${forum}/threads/archived/public`, {method: 'GET'});

  archivedThreads = await archivedThreads.json();
  allThreads = allThreads.concat(archivedThreads.threads);

  var now = Date.now();
  var out = [];
  var assistSuccess = [];
  var assistFail = [];
  var guildTradings = [];
  let requests = [];
  let tradeMultiplierText = guildTradingMultiplier == 1 ? "" : `รายได้ x${guildTradingMultiplier.toFixed(2)} จากเหตุการณ์\n\n`;
  for(var i = 0; i< allThreads.length; i++)
  {
    var firstPost = await utils.DiscordRequest(`channels/${allThreads[i].id}/messages/${allThreads[i].id}`, {method: 'GET'})
    firstPost = await firstPost.json();

    var userId = firstPost.mentions[0]?.id;

    if(!userId)
      continue;

    var messages = await utils.DiscordRequest(`channels/${allThreads[i].id}/messages?limit=100`, {method: 'GET'});
    messages = await messages.json();
    messages.reverse();

    messages = messages.filter(x => (x.author.id == userId || x.author.id == avrae) && 
      (now - new Date(x.timestamp).getTime()) < oneWeekTick && !x.reactions?.find(y => y.emoji.name == "❌"));

    var rollResult = [];
    let embeds = [];
    for (var j = 0; j< messages.length; j++)
    {
      var toSearch = (JSON.stringify(messages[j].embeds.map(x=> 
        { 
          return {
            title: x.title,
            description: x.description,
            fields: x.fields
          };
        })) 
        + messages[j].content).toLowerCase();
      if(toSearch.indexOf("guild assist") < 0)
        continue;
    
      var guildAssistResult = await handleGuildAssist(messages.slice(j), avrae, utils.TimeTextToTick(messages[j].timestamp));
      rollResult = rollResult.concat(guildAssistResult.foundRolls);
      j += guildAssistResult.postRead;
    }

    if(rollResult.length >= 0)
    {
      embeds.push({
        "title": "Compensation for Guild Assist",
        "description": `จ่ายค่าตอบแทน  Guild Assist มูลค่า ${20*rollResult.length} gp.`,
        "thumbnail": {
          "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kqolbhkqolbhkqol.jpg"
        },
        "color": 0x5B251A,
        "footer":{
          "text": `สัปดาห์ที่ ${(new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { month: "long", day: "numeric", year: "numeric" })}`
        }
      });
      assistSuccess = assistSuccess.concat(rollResult.filter(x => x.result >= 13));
      assistFail = assistFail.concat(rollResult.filter(x => x.result < 13));
    }

    let guildTradingResult = null;
    for (var j = 0; j< messages.length; j++)
    {
      var toSearch = (JSON.stringify(messages[j].embeds.map(x=> 
        { 
          return {
            title: x.title,
            description: x.description,
            fields: x.fields
          };
        })) 
        + messages[j].content).toLowerCase();

      if(toSearch.indexOf("took part in the guild trading") < 0)
        continue;

      guildTradingResult = await handleGuildTrading(messages[j]);
      
      break;
    }

    if(guildTradingResult)
    {
      guildTradingResult.total *= guildTradingMultiplier;
      guildTradingResult.player *= guildTradingMultiplier;
      guildTradingResult.guild *= guildTradingMultiplier;
      let desc = `กิลด์ค้าขายได้รับทั้งหมด ${guildTradingResult.total.toLocaleString()} gp.\nโดยคุณได้รับจากการช่วยเหลือ ${guildTradingResult.player.toLocaleString()} gp. และกิลด์ได้รับ ${guildTradingResult.guild.toLocaleString()} gp.`;
      guildTradings.push(guildTradingResult);
      embeds.push({
        "title": "Compensation for Guild Trading",
        "description": tradeMultiplierText + desc,
        "thumbnail": {
          "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kafeahkafeahkafe.jpg"
        },
        "footer": {
          "text": `สัปดาห์ที่ ${(new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { month: "long", day: "numeric", year: "numeric" })}`
        },
        "color": 0xFFFF00
      });
    }

    if(embeds.length > 0)
    {
      requests.push(utils.DiscordRequest(`channels/${allThreads[i].id}/messages`, 
      {
        method: 'POST', 
        body: {
          "content": `<@${userId}>`,
          "embeds": embeds
        }
      }));
    }
    out.push({key: allThreads[i].id, messages: guildTradingResult, firstPost: firstPost});
  }
  var totalGuildTrading = guildTradings.reduce((acc, obj) =>
  {
    acc.total += obj.total;
    acc.guild += obj.guild;
    acc.player += obj.player;
    return acc;
  }, { total: 0, guild: 0, player: 0, channelId: "", messageId: ""});
  requests.push(utils.DiscordRequest(`channels/${report}/messages`,
    {
      method: 'POST',
      body: {
        embeds: [
          {
            title: `รายงานผล Guild Assist สัปดาห์ที่ ${(new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { month: "long", day: "numeric", year: "numeric" })}`,
            fields: [
              {
                "name": "Overview",
                value: `สำเร็จ ${assistSuccess.length} ล้มเหลว ${assistFail.length}`,
                inline: true
              },
              {
                name: "Success",
                value: `${assistSuccess.map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
              },
              {
                name: "Failure",
                value: `${assistFail.map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
              }
            ],
            "color": 0x5B251A,
            "thumbnail":{
              "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kqolbhkqolbhkqol.jpg"
            }
          },
          {
            title: `รายงานผล Guild Trading สัปดาห์ที่ ${(new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { month: "long", day: "numeric", year: "numeric" })}`,
            fields: [
              {
                "name": "Overview",
                "value": `${tradeMultiplierText}รายได้ทั้งหมด - ${totalGuildTrading.total.toLocaleString()} gp. 
                  กิลด์ได้ - ${totalGuildTrading.guild.toLocaleString()} gp. 
                  เข้าตัวละคร - ${totalGuildTrading.player.toLocaleString()} gp`
              },
              {
                "name": "Found Trades",
                "value": guildTradings.map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId} - ${x.total.toLocaleString()}/${x.guild.toLocaleString()}/${x.player.toLocaleString()} gp`).join("\n")
              }
            ],
            "color": 0xFFFF00,
            "thumbnail":{
              "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kafeahkafeahkafe.jpg"
            }
          }
        ]
      }
    }
  ));
  await Promise.all(requests);
  return out;
}
async function handleGuildTrading(message)
{
  let content = JSON.stringify(message).toLowerCase().replace("\n", "").replace("\r", "");
  let regex = /จากยอดขายได้ทั้งหมด (-?\d+) gp.*guild earned : (-?\d+).*character payment :\*\* (-?\d+) gp/g;
  var regexResult = regex.exec(content);
  if(regexResult.length != 4)
    return { total: 0, guild: 0, player: 0, messageId: message.id, channelId: message.channel_id };

  return {
    total: parseInt(regexResult[1]),
    guild: parseInt(regexResult[2]),
    player: parseInt(regexResult[3]),
    messageId: message.id,
    channelId: message.channel_id,
  }
}
async function handleGuildAssist(messages, avraeId, timestamp)
{
  var out = { postRead: 0, foundRolls: []};
  if(messages[0].author.id == avraeId && 
    JSON.stringify(messages[0]).toLowerCase().indexOf("took part in the guild assist") >= 0)
  {
    //Ray's script
    out.postRead = 0;
    let content = JSON.stringify(messages[0]).toLowerCase();
    var regex = /= `(\d+)/g;
    var regexResult = regex.exec(content);
    if(regexResult != null && regexResult.length > 1)
    {
      out.foundRolls.push(
        { 
          result: parseInt(regexResult[1]),
          messageId: messages[0].id,
          channelId: messages[0].channel_id
        });
    }
  }
  else
  {
    //player's manual
    messages = messages.filter(x => x.author.id == avraeId)
    for(var i = 0; i< messages.length; i++)
    {
      var time = utils.TimeTextToTick(messages[i].timestamp);

      if(time - timestamp > oneHourTick)
        continue;

      let content = messages[i].content + " " + JSON.stringify(messages[i].embeds.map(x => x.title));
      if(content.toLowerCase().indexOf("athletics") < 0)
        continue;
      
      var desc = messages[i].embeds.map(x => x.description + JSON.stringify(x.fields));
      for(var j = 0; j< desc.length; j++)
      {
        var regex = /= `(\d+)/g;
        var regexResult = null;
        do
        {
          regexResult = regex.exec(desc[j]);
          if(regexResult != null && regexResult.length > 1){
            out.foundRolls.push({ result: parseInt(regexResult[1]), messageId: messages[i].id, channelId: messages[i].channel_id});
          }
        } while(regexResult);
      }
      out.postRead = i;
    }
  }
  return out;
}

export async function workweekThread()
{
  var attachments = [];
  var files = [];
  var multipliers = {
    trade: 1
  };
  var embeds = [ 
    weeklyEvent.tick(multipliers), 
    ...(await event.tick(attachments, files))];

  var workweekInfo = (await db.execute("select * from configuration where name = 'WEEKLY_TICK'")).rows[0];
  var mainhall = (await db.execute("select channel from configuration where name = 'MAINHALL'")).rows[0].channel;
  
  result = await utils.DiscordRequest(`channels/${workweekInfo.channel}/messages`, 
    {
      method: 'POST', 
      body: {
        "content": "<@&" + workweekInfo.role + ">!",
        "embeds": [await workweek.tick()],
        components: [],
      }
    });

  await utils.DiscordRequest(`channels/${mainhall}/messages`,
    {
      method: 'POST',
      body: {
        embeds: embeds,
        attachments: attachments
      },
      files: files
    }
  );

  return multipliers.trade;
}