
export async function handleGuildTrading(message)
{
  let content = JSON.stringify(message).toLowerCase().replace("\n", "").replace("\r", "");
  let regex = /จากยอดขายได้ทั้งหมด (-?\d+) gp.*guild earned : (-?\d+).*character payment :\*\* (-?\d+) gp/g;
  var regexResult = regex.exec(content);
  if(regexResult.length != 4)
    return null;

  return {
    total: parseInt(regexResult[1]),
    guild: parseInt(regexResult[2]),
    player: parseInt(regexResult[3]),
    messageId: message.id,
    channelId: message.channel_id,
    content: content
  }
}