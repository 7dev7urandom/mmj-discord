var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ActivityType, Client } from "discord.js";
import { token } from "./config.json";
import { stat, readdir } from "fs/promises";
import { exec, spawn } from "child_process";
import { MinecraftServerListPing } from "minecraft-status";
import { ping } from 'bedrock-protocol';
const client = new Client({
    intents: ["Guilds", "GuildMessages"],
});
let mounted = true;
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("Hello world!");
    try {
        yield stat('/mnt/test/fileExists');
        const pingJ = MinecraftServerListPing.ping(4, "localhost", 25565);
        const bedrockPing = ping({ host: "localhost", port: 19132 });
        Promise.all([pingJ, bedrockPing]).then(p => {
            var _a;
            (_a = client.user) === null || _a === void 0 ? void 0 : _a.setPresence({
                activities: [{
                        name: p[0].players.online + " players on the server",
                        type: ActivityType.Watching
                    }],
                status: "online"
            });
        }).catch(e => {
            var _a;
            console.log(e);
            (_a = client.user) === null || _a === void 0 ? void 0 : _a.setPresence({
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
            const devs = (yield readdir('/dev/')).filter(d => d.startsWith('sd'));
            const nums = {};
            devs.forEach(d => {
                var _a;
                if (d.match(/sd[a-z]\d/)) {
                    const num = d.match(/sd([a-z])(\d)/);
                    nums[num[1]] = ((_a = nums[num[1]]) !== null && _a !== void 0 ? _a : 0) + 1;
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
    }
    catch (e) {
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
                (yield client.users.fetch("494009206341369857")).send("RAID was unmounted; stopping server");
                exec("docker stop yg-paper");
            }
            mounted = false;
        }
    }
}), 1000 * 60);
client.on('ready', () => console.log("Connected!"));
client.login(token);
