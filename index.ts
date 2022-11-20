import { ActivityType, Client } from "discord.js";
import { token } from "./config.json";
import { writeFile, readdir, } from "fs/promises";
import { exec, spawn } from "child_process"
import { MinecraftServerListPing } from "minecraft-status";
import { ping } from 'bedrock-protocol';

const client = new Client({
    intents: ["Guilds", "GuildMessages"],
});

let mounted = true;
async function checkMount() {
    // console.log("Hello world!");
    if ((await getDevDisks()).length > 0) {
        const pingJ = MinecraftServerListPing.ping(4, "localhost", 25565);
        const bedrockPing = ping({ host: "localhost", port: 19132 });
        Promise.all([pingJ, bedrockPing]).then(p => {
            client.user?.setPresence({
                activities: [{
                    name: p[0].players.online + " players on the server",
                    type: ActivityType.Watching
                }],
                status: "online"
            });
        }).catch(e => {
            console.log(e);
            client.user?.setPresence({
                activities: [{
                    name: "Server is offline",
                    type: ActivityType.Watching
                }],
                status: "dnd"
            });
        });
        if (!mounted) {
            mounted = true;
            console.log("RAID was turned on");
            spawn("restartraid", await getDevDisks()).on('exit', code => {
                console.log(`restartraid exited with code ${code}`);
                if (code === 0) {
                    console.log("RAID was mounted successfully");
                    exec("docker start yg-paper");
                }
            });

        }
    } else {
        if (mounted) {
            console.log("Unmounted");
            if (client.isReady()) {
                client.user.setPresence({
                    activities: [{
                        name: "for Micah to fix me",
                        type: ActivityType.Watching
                    }],
                    status: "dnd"
                });
                (await client.users.fetch("494009206341369857")).send("RAID was unmounted; stopping server");
                exec("docker stop yg-paper");
            }
            mounted = false;
        }
    }
}
setInterval(checkMount, 1000 * 60);

async function getDevDisks() {
    const devs = (await readdir('/dev/')).filter(d => d.startsWith('sd'));
    const nums = {};
    devs.forEach(d => {
        if (d.match(/sd[a-z]\d/)) {
            const num = d.match(/sd([a-z])(\d)/)!;
            nums[num[1]] = (nums[num[1]] ?? 0) + 1;
        }
    });
    const raidObjs = Object.entries(nums).filter(([_, num]) => num === 1).map(([letter, _]) => `/dev/sd${letter}1`);
    return raidObjs;
}

client.on('ready', () => {
    console.log("Connected!");
    checkMount();
});
client.login(token)