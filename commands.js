import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';
import {db} from "./database/database.js"

const SCHEDULE_MESSAGE = {
  name: 'schedule',
  description: 'Schedule Message',
  type: 1,
  integration_types: [0,1],
  contexts: [0,2],
  options: [
    {
      name: 'message',
      type: 3,
      description: 'Text to display at specific time',
      required: true
    },
    {
      name: 'every',
      type: 3,
      description: 'Send message every.....',
      required: true,
      choices:[
        { name: "minute", value: "0 * * * * *" },
        { name: "hour", value: "0 0 * * * *"},
        { name: "day", value: "0 0 0 * * *"},
        { name: "sunday", value: "0 0 0 * * 1"}
      ]
    },
    {
      name: 'role',
      type: 9,
      description: 'Role to tag',
      required: true
    }
  ]
};
const UNSCHEDULE_MESSAGE = {
  name: 'unschedule',
  description: 'Stop message scheduling',
  type: 1,
  integration_types: [0,1],
  contexts: [0,2]
};

const DM_ADD_CHAR = {
  name: 'dmaddchar',
  description: 'Add a character',
  type: 1,
  integration_types: [0],
  contexts: [0],
  options:[
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Character's name",
    },
    {
      name: 'link',
      required: true,
      type: 3,
      description: "Link to character's sheet"
    },
    {
      name: 'guest',
      required: true,
      type: 5,
      description: "Is this the guest character?"
    },
    {
      name: 'owner',
      required: true,
      type: 9,
      description: "Owner for this character"
    },
    {
      name: 'coin',
      required: false,
      type: 10,
      description: "Starting GP for this character"
    }
  ]
}

const DM_LIST_CHAR = {
  name: 'dmlistchar',
  type: 1,
  description: "List characters owned by you",
  integration_types: [0],
  contexts: [0],
  options:[
    {
      name: 'owner',
      required: false,
      type: 9,
      description: 'Owner'
    }
  ]
}

const DM_REMOVE_CHAR = {
  name: 'dmremovechar',
  type: 1,
  description: "Remove a character from database",
  integration_types: [0],
  contexts: [0],
  options:[
    {
      name: 'owner',
      required: false,
      type: 9,
      description: "Character owner",
    }
  ]
}
const DM_COIN = {
  name: 'dmcoin',
  type: 1,
  description: "character's GP",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'add',
      required: false,
      type: 10,
      description: "GP to add"
    },
    {
      name: 'remove',
      required: false,
      type: 10,
      description: "GP to remove"
    },
    {
      name: 'char',
      required: false,
      type: 3,
      description: "Character"
    },
    {
      name: 'id',
      required: false,
      type: 3,
      description: "Character's ID"
    }
  ]
}
const DM_BUY = {
  name: 'dmbuy',
  type: 1,
  description: "Buy an item",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'item',
      required: true,
      type: 3,
      description: "Item to buy",
    },
    {
      name: 'char',
      required: true,
      type: 3,
      description: "Character"
    },
    {
      name: 'amount',
      required: false,
      type: 4,
      description: "How many do you want to buy"
    }
  ]
}
const DM_SELL = {
  name: 'dmsell',
  type: 1,
  description: "Sell an item",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'item',
      required: true,
      type: 3,
      description: "Item to sell"
    },
    {
      name: 'char',
      required: true,
      type: 3,
      description: 'Character'
    },
    {
      name: 'amount',
      required: false,
      type: 4,
      description: "How many do you want to sell?"
    }
  ]
};
const DM_WORKWEEK = {
  name: 'dmworkweek',
  type: 1,
  description: "Current character's workweek",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'add',
      required: false,
      type: 4,
      description: "Amount of workweek to add"
    }
  ]
}
const DM_ADD_GUILD = {
  name: 'dmaddguild',
  type: 1,
  description: "Detail of a guild",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Guild's name"
    }
  ]
}

const ADD_CHAR = {
  name: 'addchar',
  description: 'Add a character',
  type: 1,
  integration_types: [0],
  contexts: [0],
  options:[
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Character's name",
    },
    {
      name: 'link',
      required: true,
      type: 3,
      description: "Link to character's sheet"
    },
    {
      name: 'guest',
      required: true,
      type: 5,
      description: "Is this the guest character?"
    },
    {
      name: 'coin',
      required: false,
      type: 10,
      description: "Starting GP for this character"
    }
  ]
}

const LIST_CHAR = {
  name: 'listchar',
  type: 1,
  description: "List characters owned by you",
  integration_types: [0],
  contexts: [0]
}

const SWITCH_CHAR = {
  name: 'switchchar',
  type: 1,
  description: "Switch to another character",
  integration_types: [0],
  contexts: [0]
}
const REMOVE_CHAR = {
  name: 'removechar',
  type: 1,
  description: "Remove a character from database",
  integration_types: [0],
  contexts: [0]
}
const COIN = {
  name: 'coin',
  type: 1,
  description: "Current character's GP",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'add',
      required: false,
      type: 10,
      description: "GP to add"
    },
    {
      name: 'remove',
      required: false,
      type: 10,
      description: "GP to remove"
    }
  ]
}
const ADD_ITEM = {
  name: 'additem',
  type: 1,
  description: "Add an item into character's inventory",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'item',
      required: true,
      type: 3,
      description: "Item to add"
    },
    {
      name: 'buy',
      required: true,
      type: 5,
      description: "Are you buying or getting for free?"
    },
    {
      name: 'price',
      required: false,
      type: 10,
      description: "ราคาของ"
    },
    {
      name: 'weight',
      required: false,
      type: 10,
      description: "น้ำหนักของ"
    },
    {
      name: 'amount',
      required: false,
      type: 4,
      description: "How many do you want to buy"
    },
    {
      name: 'modifier1',
      required: false,
      type: 3,
      description: "Price modifier #1"
    },
    {
      name: 'modifier2',
      required: false,
      type: 3,
      description: "Price modifier #2"
    },
    {
      name: 'modifier3',
      required: false,
      type: 3,
      description: "Price modifier #3"
    }
  ]
}
/*const BUY = {
  name: 'buy',
  type: 1,
  description: "Buy an item",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'item',
      required: true,
      type: 3,
      description: "Item name"
    },
    {
      name: 'shop',
      required: false,
      type: 3,
      description: "Where are you buying this item?"
    }
  ]
}*/
const SYNC = {
  name: 'sync',
  type: 1,
  description: "Sync inventory and coin to gsheet/dndbeyond",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'inventory',
      required: true,
      type: 5,
      description: "sync inventory"
    },
    {
      name: 'coin',
      required: true,
      type: 5,
      description: "sync coin"
    }
  ]
};
const REMOVE_ITEM = {
  name: 'removeitem',
  type: 1,
  description: "Remove an item",
  integration_types: [0],
  contexts: [0],
  options:[
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Item's name"
    },
    {
      name: 'sell',
      required: true,
      type: 5,
      description: "Are you selling?"
    },
    {
      name: 'amount',
      required: false,
      type: 4,
      description: "How many to remove"
    },
    {
      name: 'modifier1',
      required: false,
      type: 3,
      description: "Price modifier #1"
    },
    {
      name: 'modifier2',
      required: false,
      type: 3,
      description: "Price modifier #2"
    },
    {
      name: 'modifier3',
      required: false,
      type: 3,
      description: "Price modifier #3"
    }
  ]
}
/*const SELL = {
  name: 'sell',
  type: 1,
  description: "Sell an item",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Item's name"
    },
    {
      name: 'price',
      required: false,
      type: 10,
      description: "Price"
    },
    {
      name: 'amount',
      required: false,
      type: 4,
      description: "How many to remove"
    }
  ]
};*/
const WORKWEEK = {
  name: 'workweek',
  type: 1,
  description: "Current character's workweek",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'add',
      required: false,
      type: 4,
      description: "Amount of workweek to add"
    },
    {
      name: 'remove',
      required: false,
      type: 4,
      description: "Amount of workweek to remove"
    }
  ]
}
const GUILD = {
  name: 'guild',
  type: 1,
  description: "Detail of a guild",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Guild's name"
    }
  ]
}
const INVENTORY = {
  name: 'inventory',
  type: 1,
  description: "List available items",
  integration_types: [0],
  contexts: [0]
}
const DM_GUILD_COIN = {
  name: 'dmguildcoin',
  type:1,
  description: "Adjust guild's coin",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'name',
      required: false,
      type: 3,
      description: "Guild's name"
    },
    {
      name: 'id',
      required: false,
      type: 3,
      description: "Guild's ID"
    },
    {
      name: 'add',
      required: false,
      type: 4,
      description: "Add guild's coin",
    },
    {
      name: 'remove',
      required: false,
      type: 4,
      description: "Remove guild's coin"
    }
  ]
}
const DM_SET_CHANNEL = {
  name: 'dmsetchannel',
  type: 1,
  description: "Set current channel's purpose for bot",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'for',
      required: true,
      type: 3,
      description: "Channel"
    }
  ]
}
const TICK = {
  name: 'tick',
  type: 1,
  description: "Force a weekly tick",
  integration_types: [0],
  contexts: [0],
}
const CONFIG = {
  name: 'config',
  type: 1,
  description: "Configure channels, cron and roles",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'name',
      required: true,
      type: 3,
      description: "Name",
      choices: await generateConfigValues()
    },
    {
      name: 'role',
      required: false,
      type: 8,
      description: "Role"
    },
    {
      name: 'channel',
      required: false,
      type: 7,
      description: "Channel"
    },
    {
      name: 'cron',
      required: false,
      type: 3,
      description: 'Cron'
    },
    {
      name: 'user',
      required: false,
      type: 6,
      description: "User"
    }
  ]
}

const TEST_EMBED = {
  name: 'testembed',
  type: 1,
  description: "Test Embed.",
  integration_types: [0],
  contexts: [0]
}

const ADD_EVENT = {
  name: 'addevent',
  type: 1,
  description: "เพิ่มข่าวประจำสัปดาห์",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'head',
      required: true,
      type: 3,
      description: "หัวข้อข่าว"
    },
    {
      name: 'body',
      required: true,
      type: 3,
      description: 'รายละเอียดข่าว'
    },
    {
      name: 'image',
      required: false,
      type: 11,
      description: 'ลิงค์ภาพ'
    }
  ]
};
const REMOVE_EVENT = {
  name: 'removeevent',
  type: 1,
  description: "ลบข่าวประจำสัปดาห์",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: "head",
      required: true,
      type: 3,
      description: "หัวข้อข่าว"
    }
  ]
};

const EDIT_CHAR = {
  name: 'editchar',
  type: 1,
  description: "Edit Character",
  integration_types: [0],
  contexts: [0],
  options: [
    {
      name: 'oldname',
      required: false,
      type: 3,
      description: "ชื่อตัวละครอันเดิม ใช้เลือกตัวละครที่เปลี่ยน ถ้าไม่ระบุจะใช้ตัวละครปัจจุบัน"
    },
    {
      name: 'newname',
      required: false,
      type: 3,
      description: "ชื่อตัวละครใหม่"
    },
    {
      name: 'newlink',
      required: false,
      type: 3,
      description: "ลิงค์ชีทตัวละครใหม่"
    }
  ]
}
const ALL_COMMANDS = [//SCHEDULE_MESSAGE, UNSCHEDULE_MESSAGE,
  ADD_CHAR,
  ADD_EVENT,
  ADD_ITEM,
  EDIT_CHAR,
  CONFIG,
  LIST_CHAR,
  SWITCH_CHAR,
  REMOVE_CHAR,
  REMOVE_ITEM,
  REMOVE_EVENT,
  COIN,
  SYNC,
  INVENTORY,
  //BUY,
  //SELL,
  /*WORKWEEK,
  GUILD,
  DM_ADD_CHAR,
  DM_ADD_GUILD,
  DM_BUY,
  DM_COIN,
  DM_LIST_CHAR,
  DM_REMOVE_CHAR,
  DM_SELL,
  DM_WORKWEEK,
  DM_GUILD_COIN,
  DM_SET_CHANNEL,
*/
  //TICK,

  //TEST_EMBED
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

async function generateConfigValues()
{
  var result = await db.execute("select name from configuration");

  result = result.rows;
  var outgoing = [];
  result.forEach(x =>
  {
    outgoing.push({name: x.name, value: x.name})
  });
  return outgoing;
}