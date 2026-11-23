import * as weeklyEvent from "@/ticks/weeklyevent.js";
import * as utils from "@/utils.js";
import * as event from "@/commands/event.js";
import {db} from "@/database/database.js";
import { oneWeekTick, oneHourTick, timezoneDiffTick, oneDayTick } from "@/constants";
import { handleGuildAssist } from "./playerRoom/guildAssist";
import { handleGuildTrading } from "./playerRoom/guildTrading";
import { handleRunningBusiness } from "./playerRoom/runnigBusiness";

export default async function handler(req, res)
{
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
/*
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).end('Unauthorized');
    }*/
    var rows = (await db.execute("select * from configuration")).rows;
    let entries = {};
    
    var now = Date.now();
    rows.forEach(row=>
    {
      entries[row.name] = {
        channel: row.channel,
        user: row.user,
        role: row.role,
      }
    });
    
    let multiplier = await workweekThread(entries, now);
    await Promise.all([
      playerRoomThreads(multiplier.trade, multiplier.business, entries, now),
      questRoom(entries, now)
    ]);

    res.status(200).json({ name: "Tick complete!" });
}

export async function questRoom(entries, now)
{
  var forum = entries['QUEST_FORUM'].channel;
  var report = entries['REPORT'].channel;

  var weekAgoText = (new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { day: "numeric"}) + " - " + 
    (new Date(now + timezoneDiffTick - oneDayTick)).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric"});
  var channelInfo = await utils.DiscordRequest(`channels/${forum}`, { method: 'GET' });

  channelInfo = await channelInfo.json();

  var activeThreads = await utils.DiscordRequest(`guilds/${channelInfo.guild_id}/threads/active`, { method: 'GET' });
  activeThreads = await activeThreads.json()

  var allThreads = activeThreads.threads.filter(x => x.parent_id == forum);

  var archivedThreads = await utils.DiscordRequest(`channels/${forum}/threads/archived/public`, {method: 'GET'});

  archivedThreads = await archivedThreads.json();
  allThreads = allThreads.concat(archivedThreads.threads).filter(x =>
    (now - new Date(x.thread_metadata.create_timestamp)) < oneWeekTick
  );

  await utils.DiscordRequest(`channels/${report}/messages`,
  {
    method: 'POST',
    body: {
      embeds: [
        {
          title: `รายงานเควสท์สัปดาห์ที่ ${weekAgoText}`,
          fields: [
            {
              "name": "Overview",
              value: `มีทั้งหมด ${allThreads.length} เควสท์`,
              inline: true
            },
            ...questField(allThreads, channelInfo)
          ],
          "color": 0xac1cff,
          "thumbnail":{
            "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_ja0bvjja0bvjja0b.jpg"
          }
        },
      ]
    }
  });
}

export function questField(allThreads, channelInfo)
{
  const linkPerField = 10;
  let outgoing = [{
    "name": "เควสท์ที่ตรวจพบ",
    "value": allThreads.slice(0, linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.id}/${x.id} - ${x.name}`).join("\n")
  }]
  for(let i = linkPerField; i< allThreads.length; i += linkPerField)
  {
    outgoing.push({
      name: "",
      value: allThreads.slice(i, i+linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.id}/${x.id} - ${x.name}`).join("\n")
    })
  }
  return outgoing;
}
export async function playerRoomThreads(guildTradingMultiplier, runningBusinessBonus, entries, now)
{
  var forum = entries['PLAYER_FORUM'].channel;
  var avrae = entries['AVRAE'].user;
  var report = entries['REPORT'].channel;

  var channelInfo = await utils.DiscordRequest(`channels/${forum}`, { method: 'GET' });

  channelInfo = await channelInfo.json();

  var activeThreads = await utils.DiscordRequest(`guilds/${channelInfo.guild_id}/threads/active`, { method: 'GET' });
  activeThreads = await activeThreads.json()

  var allThreads = activeThreads.threads.filter(x => x.parent_id == forum);

  var archivedThreads = await utils.DiscordRequest(`channels/${forum}/threads/archived/public`, {method: 'GET'});

  archivedThreads = await archivedThreads.json();
  allThreads = allThreads.concat(archivedThreads.threads);

  var weekAgoText = (new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { day: "numeric"}) + " - " + 
    (new Date(now + timezoneDiffTick - oneDayTick)).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric"});
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

    if(rollResult.length > 0)
    {
      embeds.push({
        "title": "Compensation for Guild Assist",
        "description": `จ่ายค่าตอบแทน Guild Assist มูลค่า ${20*rollResult.length} gp.`,
        "thumbnail": {
          "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kqolbhkqolbhkqol.jpg"
        },
        "color": 0x5B251A,
        "footer":{
          "text": `สัปดาห์ที่ ${weekAgoText}`
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
      
      if(!guildTradingResult)
        continue;
      
      break;
    }

    if(guildTradingResult)
    {
      if(guildTradingMultiplier != 1)
      {
        let playerPercent = guildTradingResult.player / guildTradingResult.total;
        let total = guildTradingResult.total * guildTradingMultiplier;
        guildTradingResult.total = total;
        guildTradingResult.player = total * playerPercent;
        guildTradingResult.guild = total - 100 - guildTradingResult.player;
      }
      let desc = `กิลด์ค้าขายได้รับทั้งหมด ${guildTradingResult.total.toLocaleString()} gp.\nโดยคุณได้รับจากการช่วยเหลือ ${guildTradingResult.player.toLocaleString()} gp. และกิลด์ได้รับ ${guildTradingResult.guild.toLocaleString()} gp.`;
      guildTradings.push(guildTradingResult);
      embeds.push({
        "title": "Compensation for Guild Trading",
        "description": tradeMultiplierText + desc,
        "thumbnail": {
          "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kafeahkafeahkafe.jpg"
        },
        "footer": {
          "text": `สัปดาห์ที่ ${weekAgoText}`
        },
        "color": 0xFFFF00
      });
    }

    let runningBusinessResult = await handleRunningBusiness(messages, avrae, runningBusinessBonus);
    for(let j = 0; j< runningBusinessResult.length; j++)
    {
      let bonusText = "";
      if(runningBusinessBonus != 0)
        bonusText = "ได้รับโบนัสการทอย " + runningBusinessBonus + " จากเหตุการณ์\n\n";

      let desc = "";
      if(!runningBusinessResult[j].rollPost)
        desc += `ทอยผลรายได้ของ Trading Post...\n${runningBusinessResult[j].rollString} = ${runningBusinessResult[j].rollResult}\n\n`;
      /*else
        desc += `ตรวจพบการทอยเอง = ${runningBusinessResult[j].rollResult}\nhttps://discord.com/channels/${channelInfo.guild_id}/${allThreads[i].id}/${runningBusinessResult[j].rollPost}\n\n`;*/
      desc += `Trading Post ได้สร้างรายได้ทั้งหมด ${runningBusinessResult[j].rollResult.toLocaleString()} gp`;
      embeds.push({
        "title": "Revenue for Running Business Arrived",
        "description": bonusText + desc,
        "footer": {
          "text": `สัปดาห์ที่ ${weekAgoText}`
        },
        "thumbnail":{
          "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/the-bustling-trade-ward-epic-medieval-fantasy-marketplace-julia-the-pooh.jpg"
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
            title: `รายงานผล Guild Assist สัปดาห์ที่ ${weekAgoText}`,
            fields: [
              {
                "name": "Overview",
                value: `สำเร็จ ${assistSuccess.length} ล้มเหลว ${assistFail.length}`,
                inline: true
              },
              ...assistFields(assistSuccess, assistFail, channelInfo)
            ],
            "color": 0x5B251A,
            "thumbnail":{
              "url": "https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/Gemini_Generated_Image_kqolbhkqolbhkqol.jpg"
            }
          },
          {
            title: `รายงานผล Guild Trading สัปดาห์ที่ ${weekAgoText}`,
            fields: [
              {
                "name": "Overview",
                "value": `${tradeMultiplierText}รายได้ทั้งหมด - ${totalGuildTrading.total.toLocaleString()} gp. 
                  กิลด์ได้ - ${totalGuildTrading.guild.toLocaleString()} gp. 
                  เข้าตัวละคร - ${totalGuildTrading.player.toLocaleString()} gp`
              },
              ...tradingFields(guildTradings, channelInfo)
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
function assistFields(assistSuccess, assistFail, channelInfo)
{
  const linkPerField = 10;
  var outgoing = [{
      name: "Success",
      value: `${assistSuccess.slice(0, linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
    }
  ];

  for(let i = linkPerField; i< assistSuccess.length; i += linkPerField)
  {
    outgoing.push({
      name: "",
      value: `${assistSuccess.slice(i, i+linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
    })
  }

  outgoing.push(
    {
      name: "Failure",
      value: `${assistFail.slice(0, linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
    });

  for(let i = linkPerField; i< assistFail.length; i += linkPerField)
  {
    outgoing.push({
      name: "",
      value: `${assistFail.slice(i, i+linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId}`).join('\n')}`
    })
  }
  return outgoing;
}
function tradingFields(guildTradings, channelInfo)
{
  guildTradings = guildTradings.sort((a, b) => a.total - b.total);
  const linkPerField = 10;
  let outgoing = [{
    "name": "Found Trades",
    "value": guildTradings.slice(0, linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId} - ${x.total.toLocaleString()}/${x.guild.toLocaleString()}/${x.player.toLocaleString()} gp`).join("\n")
  }]
  for(let i = linkPerField; i< guildTradings.length; i += linkPerField)
  {
    outgoing.push({
      name: "",
      value: guildTradings.slice(i, i+linkPerField).map(x => `https://discord.com/channels/${channelInfo.guild_id}/${x.channelId}/${x.messageId} - ${x.total.toLocaleString()}/${x.guild.toLocaleString()}/${x.player.toLocaleString()} gp`).join("\n")
    })
  }

  return outgoing;
}

export async function workweekThread(entries, now)
{
  var attachments = [];
  var files = [];
  var multipliers = {
    trade: 1,
    business: 0
  };
  var embeds = [ 
    weeklyEvent.tick(multipliers), 
    ...(await event.tick(attachments, files))];

  var workweekInfo = entries['WEEKLY_TICK'];
  var mainhall = entries['MAINHALL'].channel;
  
  var weekAgoText = (new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { day: "numeric"}) + " - " + 
    (new Date(now + timezoneDiffTick - oneDayTick)).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric"});

  await utils.DiscordRequest(`channels/${workweekInfo.channel}/messages`, 
    {
      method: 'POST', 
      body: {
        "content": "<@&" + workweekInfo.role + ">!",
        "embeds": [{
            title: "Upkeep Time!!",
            description: "ได้เวลาจ่ายค่ากินอยู่จำนวน 10 gp ของสัปดาห์ที่ " + weekAgoText + " แล้วจ้า!\n\n(กด !ww เพื่อรับ workweek)",
            image:
            {
                url: "https://i.ibb.co/1fKg57M4/Gemini-Generated-Image-ppub2ppub2ppub2p.png"
            },
            color: 0xFFFFFF
        }],
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

  return multipliers;
}