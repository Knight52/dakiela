import * as utils from '../utils.js'
import * as embeds from "../commands/embeds.js";
import { DiceRoller } from "dice-roller-parser";
import { oneDayTick, oneWeekTick, timezoneDiffTick } from '@/constants.js';

export function tick(multipliers)
{
    multipliers.trade = 1;
    const diceRoller = new DiceRoller();

    //	Returns the total rolled value
    const roll = diceRoller.rollValue("d100");

    var text = "";
    var desc = "";
    var image = "";
    var color = 0;

    if(roll <= 50)
    {
        text = "All Is Well";
        desc = "ช่วงเวลาแสนสงบ สัปดาห์นี้ไม่มีเหตุการณ์พิเศษอะไร...";
        image = "https://i.imgur.com/SIVB5Kp.jpeg"
        color = 0x00FF59;
    }
    else if(roll <= 55)
    {
        text = "Attack";
        
        var injured = diceRoller.rollValue("2d6");
        var death = Math.floor(diceRoller.rollValue("2d6/4"));
        var percent = diceRoller.rollValue("(1d6+4)*10");

        desc = "รถม้าสินค้าของกิลด์ถูกโจมตี!!! บางทีอาจจะเป็นโจรป่าหรือไม่สัตว์ร้ายระหว่างทางโดยมีทหารคุุ้มกันบาดเจ็บ " + injured + " นายและเสียชีวิต " + death + " นายโดยสินค้าได้รับความเสียหาย " + percent + " เปอร์เซ็น";
        image = "https://i.pinimg.com/736x/a6/cb/df/a6cbdf89ccce9c2da173b7f8b40461c4.jpg";
        color = 0x000000;
        multipliers.trade -= percent / 100;
    }
    else if(roll <= 58)
    {
        text = "Renovation";
        var gold = diceRoller.rollValue("1d6*100");
        desc = "นักผจญภัยบางคนทำสิ่งของเสียหายจนทางกิลค์จะต้องจ่ายค่าซ่อมแซม " + gold + " GP.";
        image = "https://i.pinimg.com/1200x/a6/f7/21/a6f721835b6a25d19f2ff03115b39c2f.jpg";
        color = 0xFFA654;
    }
    else if (roll <= 63)
    {
        text = "Extraordinary Opportunity";
        var bonus = diceRoller.rollValue("1d10*5");
        var percentage = diceRoller.rollValue("(1d6+4)*10");
        desc = "เสียงดังครึกครื้นไปทั่วพื้นที่ ทางเมืองมีผู้คนมากมายเดินทางเข้ามาในสัปดาห์นี้ทาง Guild Trading ได้รับเงินเพิ่ม " + percentage + " เปอร์เซ็นและ Running a Business ได้รับโบนัส " + bonus + " แต้ม"
        image = "https://i.pinimg.com/1200x/27/1e/90/271e900de7d188c5196fe1a2ed6f60c4.jpg"
        color = 0xFFE500;
        multipliers.trade += percentage / 100;
    }
    else if (roll <= 72)
    {
        text = "Private Space" 
        var gold = diceRoller.rollValue('1d6*100');
        desc = "สัปดาห์นี้มีกลุ่มหรือบุคคลได้จับจองใช้งานสถานที่บางส่วนของกิลด์เป็นการส่วนตัวในการจ่ายค่าพื้นที่ " + gold + " GP."
        image = "https://i.pinimg.com/1200x/62/a8/f6/62a8f6c18bbad098d3b7052293f06040.jpg"
        color = 0xE100FF;
    }
    else if (roll <= 76)
    {
        text = "Community Gathering" 
        var result = diceRoller.rollValue('1d4');
        var story = ""
        if (result == 1)
        {
            var gold = diceRoller.rollValue('1d6*100');
            story = "บุคคลหรือกลุ่มนึงเดินทางมาที่กิลด์เพื่อตอบแทนการช่วยเหลือมาตลอดทั้งในตอนนี้และอนาคตโดยจ่ายให้ " + gold + " GP."
            color = 0xFFE500;
        }
        else if (result == 2)
        {
            var amount = diceRoller.rollValue('1d8+2')
            story = "นักผจญภัยบางคนทำ Potion of Healing มาให้กองกลางจำนวน " + amount + " ขวด";
            color = 0xFF002A;
        }
        else if (reuslt == 3)
        {
            var amount = diceRoller.rollValue('1d4')
            story = "บุคคลหรือชาวบ้านได้เข้ามาประจำในเป็นทหารดูรักษาการณ์เพิ่มขึ้น " + amount + " คน";
            color = 0xE100FF;
        }
        else 
        {
            story = "นักจผญภัยคนบางคนต้องเขียน Spell Scroll จำนวนมากต้องการคนร่วมจ่ายค่าวัตถุคนละครึ่ง (ค่าใช้จ่าย Scribe Scroll ลดลงครึ่งนึง)"
            color = 0x4F63FF;
        }
        desc = "สัปดาห์นี้มีการเคลื่อนไหวบางอย่างจากเรื่องที่มี" + story
        image = "https://i.pinimg.com/1200x/b4/ec/24/b4ec2453635cf6dc992939c91f9ff13a.jpg"
    }
    else if (roll <= 79)
    {
        text = "Lost Employee" 
        var missing = ""
        var result = diceRoller.rollValue('1d4');
        if (result == 2)
            missing = "Garden"
        else 
            missing = "Smithy"
        desc = "สัปดาห์นี้มีพนักงานบางส่วนไม่อยู่ทำให้พื้นที่ " + missing + " ไม่สามารถใช้งานได้"
        image = "https://i.pinimg.com/1200x/b8/5f/1b/b85f1be9d14a5b23fb296343be96bd60.jpg"
        color = 0xBC8000;
    }
    else if (roll <= 83)
    {
        text = "Magical Discovery" 
        var level = Math.floor(diceRoller.rollValue('(1d12+4)/5'))
        desc = "สัปดาห์นี้มีนักผจญภัยนำ Spell Scroll ระดับ " + level + " ที่หาได้จากภารกิจมาให้กองกลางกิลด์";
        image = "https://i.pinimg.com/1200x/c3/6f/94/c36f94eca37c786c00366e4f6dcbe624.jpg";
        color = 0x6E43BC;
    }
    else if (roll <= 91)
    {
        text = "Mutual Support" 
        var w = Math.floor(diceRoller.rollValue('(1d4+1)/2'))
        var gold = diceRoller.rollValue('1d6*100')
        desc = "สัปดาห์นี้มีชาวบ้านเข้ามาช่วยเหลือในการก่อสร้างจำนวน " + w + " Workroll โดยทางกิลด์จ่ายค่าตอบแทน " + gold + " GP."
        image = "https://i.pinimg.com/1200x/82/e9/ba/82e9bac0010e5f8b65b9e5f809314283.jpg"
        color = 0xF2FF00;
    }
    else if (roll <= 98)
    {
        text = "Request for Aid" 
        var death = ""
        var g = diceRoller.rollValue('4d6')
        if (g <= 9)
            death = "โดยมีทหารเสียชีวิต 1 นาย"
        else 
            death = "โดยไม่มีใครบาดเจ็บ"
        desc = "สัปดาห์นี้ทางผู้รักษาการณ์ได้มีการส่งทหารไปจัดการสัตว์ร้ายบริเวณเมือง" + death;
        image = "https://i.pinimg.com/1200x/74/7e/6f/747e6fa1e85861f8a36aa4230a6c74fe.jpg" ;
        color = 0xFF0083;
    }
    else
    {
        text = "Treasure Award" 
        var reward = ""
        var result = diceRoller.rollValue('1d100')
        if (result <= 40)
            reward = "Art Objects มูลค่า 25 GP."
        else if (result <= 63)
            reward = "Art Objects มูลค่า 250 GP."
        else if (result <= 73)
            reward = "Art Objects มูลค่า 750 GP."
        else if (result <= 75)
            reward = "Art Objects มูลค่า 2,500 GP."
        else if (result <= 90)
            reward = "Magic Item ระดับ Common"
        else if (result <= 98)
            reward = "Magic Item ระดับ Uncommon"
        else 
            reward = "Magic Item ระดับ Rare"
        desc = "สัปดาห์นี้นายจ้างเก่าได้เดินทางกลับมาตอบแทนกิลด์อย่างสุดซึ้งด้วย " + reward;
        image = "https://i.pinimg.com/1200x/54/ee/87/54ee87c9a67c6e184979506a27c9ae14.jpg" 
        color = 0xFFFF00;
    }
    let now = Date.now();
    return {
        title: "เหตุการณ์ประจำสัปดาห์ที่ " + (new Date(now + timezoneDiffTick - oneWeekTick)).toLocaleDateString("th-TH", { day: "numeric"}) + " - " + 
            (new Date(now + timezoneDiffTick - oneDayTick)).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric"}),
        description: "d100 = " + roll + "\n\n" + desc,
        image: {
            url: image
        },
        color: color
    }
}
