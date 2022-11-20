import { ActivityType, Client } from "discord.js";
import { token } from "./config.json";
import { stat, readdir } from "fs/promises";
import { exec, spawn } from "child_process"
import { MinecraftServerListPing } from "minecraft-status";

const client = new Client({
    intents: ["Guilds", "GuildMessages"],
});

let mounted = true;

setInterval(async () => {
    // console.log("Hello world!");
    try {
        await stat('/mnt/test/fileExists')
        const ping = MinecraftServerListPing.ping();
        ping.then(p => client.user?.setPresence({
            activities: [{
                name: p.players.online + " players on the server",
                type: ActivityType.Watching
            }]
        }));
        if (!mounted) {
            mounted = true;
            console.log("RAID was turned on");
            const devs = (await readdir('/dev/')).filter(d => d.startsWith('sd'));
            const nums = {};
            devs.forEach(d => {
                if (d.match(/sd[a-z]\d/)) {
                    const num = d.match(/sd([a-z])(\d)/)!;
                    nums[num[1]] = (nums[num[1]] ?? 0) + 1;
                }
            });
            const raidObjs = Object.entries(nums).filter(([_, num]) => num === 1).map(([letter, _]) => `/dev/sd${letter}1`);
            spawn("restartraid", raidObjs).on('exit', code => {
                console.log(`restartraid exited with code ${code}`);
                if (code === 0) {
                    console.log("RAID was mounted successfully");
                    exec("docker start yg-paper");
                }
            });

        }
    } catch (e) {
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
}, 1000 * 60);

client.on('ready', () => console.log("Connected!"));
client.login(token)