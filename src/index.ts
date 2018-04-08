import { AutojoinRoomsMixin, MatrixClient, SimpleRetryJoinStrategy } from "matrix-bot-sdk";
import config from "./config";
import { LogService } from "matrix-js-snippets";
import { CommandProcessor } from "./matrix/CommandProcessor";
import { LocalstorageStorageProvider } from "./bot/LocalstorageStorageProvider";
import { BuilderRegistry } from "./bot/BuilderRegistry";
import { StickerStore } from "./db/StickerStore";
import { Webserver } from "./web/webserver";

LogService.configure(config.logging);
const storageProvider = new LocalstorageStorageProvider("./storage");
const client = new MatrixClient(config.homeserverUrl, config.accessToken, storageProvider);
const commands = new CommandProcessor(client);

async function run() {
    await StickerStore.updateSchema();
    Webserver.start();

    const userId = await client.getUserId();

    client.on("room.message", (roomId, event) => {
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

    AutojoinRoomsMixin.setupOnClient(client);
    client.setJoinStrategy(new SimpleRetryJoinStrategy());
    return client.start();
}

run().then(() => LogService.info("index", "Sticker bot started!"));
