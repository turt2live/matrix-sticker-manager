import { AutojoinRoomsMixin, MatrixClient, SimpleRetryJoinStrategy } from "matrix-bot-sdk";
import config from "./config";
import { CommandProcessor } from "./matrix/CommandProcessor";
import { Appservice } from "matrix-bot-sdk/lib/appservice/Appservice";
import { SimpleFsStorageProvider } from "matrix-bot-sdk/lib/storage/SimpleFsStorageProvider";
import { BuilderRegistry } from "./bot/BuilderRegistry";
import { LogService } from "matrix-bot-sdk/lib/logging/LogService";
import Webserver from "./web/webserver";
import * as path from "path";
import { StickerStore } from "./storage/StickerStore";

async function run() {
    // Cheat and use a client to get the user ID for the appservice bot
    const client = new MatrixClient(config.appservice.homeserverUrl, config.appservice.asToken);
    const userId = await client.getUserId();
    const localpart = userId.substring(1).split(":")[0];

    const store = new StickerStore(client);
    const commands = new CommandProcessor(client, store);

    const appservice = new Appservice({
        bindAddress: config.webserver.bind,
        port: config.webserver.port,
        homeserverName: config.appservice.domainName,
        homeserverUrl: config.appservice.homeserverUrl,
        storage: new SimpleFsStorageProvider(path.join(config.dataPath, "bot.json")),
        registration: {
            as_token: config.appservice.asToken,
            hs_token: config.appservice.hsToken,
            id: "stickers",
            namespaces: {
                users: [{regex: "@stickers.*", exclusive: true}],
                aliases: [],
                rooms: [],
            },
            sender_localpart: localpart,
            url: "http://localhost",
        },
        joinStrategy: new SimpleRetryJoinStrategy(),
    });

    Webserver.begin(appservice, store);

    appservice.on("room.message", (roomId, event) => {
        if (event['sender'] === userId) return;
        if (!event['content']) return;
        if (event['type'] !== "m.room.message" && event['type'] !== "m.sticker") return; // Everything we care about is a message or sticker

        const isText = event['content']['msgtype'] === "m.text";
        const isCommand = isText && (event['content']['body'] || "").toString().startsWith("!stickers");

        if (BuilderRegistry.hasBuilder(roomId) && !isCommand) {
            return BuilderRegistry.handleEvent(roomId, event);
        }

        return commands.tryCommand(roomId, event);
    });

    AutojoinRoomsMixin.setupOnAppservice(appservice);
    return appservice.begin();
}

run().then(() => LogService.info("index", "Sticker bot started!"));
