import { oneWeekTick, oneHourTick, timezoneDiffTick, oneDayTick } from "@/constants";
import * as utils from "@/utils.js";
import { DiceRoller } from "dice-roller-parser";
export async function handleRunningBusiness(messages, avraeId, rollBonus)
{
    var out = [];
    for(let i = 0; i< messages.length; i++)
    {
      var toSearch = (JSON.stringify(messages[i].embeds.map(x=> 
        { 
          return {
            title: x.title,
            description: x.description,
            fields: x.fields
          };
        })) 
        + messages[i].content).toLowerCase();
      if(toSearch.indexOf("running a business") < 0)
        continue;

      let result = processRunningBusiness(messages.slice(i), avraeId, rollBonus, utils.TimeTextToTick(messages[i].timestamp));
      i += result.postRead;

      if(!result.rollResult)
        continue;

      out.push({
        rollResult: result.rollResult,
        rollString: result.rollString,
        d100Result: result.d100Result,
        rollPost: result.rollPost
      });
    }
  return out;
}
function processRunningBusiness(messages, avraeId, rollBonus, timestamp)
{
    let out = {
        postRead: 0,
        rollString: null,
        rollResult: null,
        d100Result: 0,
        rollPost: null
    };
    let d100Result = 0;
    //player's manual
    messages = messages.filter(x => x.author.id == avraeId)
    let i = 0;
    for(i = 0; i< messages.length; i++)
    {
        var time = utils.TimeTextToTick(messages[i].timestamp);

        if(time - timestamp > oneHourTick)
            break;

        if(messages[i].author.id != avraeId)
            continue;

        out.postRead = i;
        var regex = /1d100 \((\d+)\)/gms;

        let content = messages[i].content;
        let regexResult = regex.exec(content);

        if(regexResult && regexResult.length == 2)
        {
            d100Result = parseInt(regexResult[1]);
            break;
        }
    }

    if(d100Result == 0)
        return out;

    d100Result += rollBonus;
    out.d100Result = d100Result;
    let rollRegex = / /gms;
    if(d100Result > 140)
        rollRegex = /12d10 \(.*\) \+ 100.*: (\d+)/gms;
    else if(d100Result >= 121)
        rollRegex = /10d10 \(.*\) \+ 50.*: (\d+)/gms;
    else if(d100Result >= 101)
        rollRegex = /8d10 \(.*\) \+ 50.*: (\d+)/gms;
    else if(d100Result >= 91)
        rollRegex = /6d10 \(.*\) \+ 50.*: (\d+)/gms;
    else if(d100Result >= 81)
        rollRegex = /4d10 \(.*\) \+ 10.*: (\d+)/gms;
    else if(d100Result >= 71)
        rollRegex = /4d8 \(.*\) \+ 10.*: (\d+)/gms;
    else if(d100Result >= 51)
        rollRegex = /4d8 \(.*\) \+ 5.*: (\d+)/gms;
    else if(d100Result >= 21)
        rollRegex = /4d6.*: (\d+)/gms;
    else if(d100Result >= 11)
        rollRegex = /3d4.*: (\d+)/gms;
    else
        rollRegex = /2d4.*: (\d+)/gms;

    let rollResult = 0;
    for(i; i < messages.length; i++)
    {
        if (messages[i].author.id != avraeId)
            continue;

        out.postRead = i;
        let regexResult = rollRegex.exec(messages[i].content);
        if(!regexResult || regexResult.length != 2)
            continue;

        rollResult = parseInt(regexResult[1]);
        out.rollResult = rollResult;
        out.rollPost = messages[i].id;
    }


    if(rollResult == 0)
    {
        let rollString = "";
        if(d100Result > 140)
            rollString = "(12d10 + 100) * 100";
        else if(d100Result >= 121)
            rollString = "(10d10 + 50) * 100";
        else if(d100Result >= 101)
            rollString = "(8d10 + 50) * 100";
        else if(d100Result >= 91)
            rollString = "(6d10 + 10) * 100";
        else if(d100Result >= 81)
            rollString = "(4d10 + 10) * 100";
        else if(d100Result >= 71)
            rollString = "(4d8 + 10) * 100";
        else if(d100Result >= 51)
            rollString = "(4d8 + 5) * 100";
        else if(d100Result >= 21)
            rollString = "4d6 * 100";
        else if(d100Result >= 11)
            rollString = "3d4 * 100";
        else
            rollString = "2d4 * 100";

        out.rollString = rollString;

        let diceRoller = new DiceRoller();
        let diceRollerResult = diceRoller.roll(rollString);
        out.rollResult = diceRollerResult.value;
        out.d100Result = d100Result;
    }
    return out;
}