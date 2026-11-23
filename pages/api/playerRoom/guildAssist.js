import { oneWeekTick, oneHourTick, timezoneDiffTick, oneDayTick } from "@/constants";
import * as utils from "@/utils.js";

export async function handleGuildAssist(messages, avraeId, timestamp)
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