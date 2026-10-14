import fs from "fs/promises";
import path from "path";

const TOKEN = process.env.VERCEL_TOKEN;
const DEPLOYMENT = process.argv[2];          // dpl_xxx
const TEAM = process.env.VERCEL_TEAM_ID;     // optional, only if it's under a team
const OUT = "./recovered";

const q = TEAM ? `?teamId=${TEAM}` : "";
const headers = { Authorization: `Bearer ${TOKEN}` };

const tree = await (await fetch(
  `https://api.vercel.com/v6/deployments/${DEPLOYMENT}/files${q}`, { headers }
)).json();

async function walk(nodes, dir) {
  for (const n of nodes) {
    const p = path.join(dir, n.name);
    if (n.type === "directory") {
      await walk(n.children ?? [], p);
    } else if (n.type === "file") {
      const r = await fetch(
        `https://api.vercel.com/v7/deployments/${DEPLOYMENT}/files/${n.uid}${q}`, { headers }
      );
      const { data } = await r.json();       // base64 content
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, Buffer.from(data, "base64"));
      console.log("saved", p);
    }
  }
}
await walk(tree, OUT);