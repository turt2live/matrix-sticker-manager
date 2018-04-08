import { MatrixClient } from "matrix-bot-sdk";
import { LogService } from "matrix-js-snippets";
import * as striptags from "striptags";
import { BuilderRegistry } from "../bot/BuilderRegistry";
import { NewPackBuilder } from "../builders/NewPackBuilder";

export class CommandProcessor {
    constructor(private client: MatrixClient) {
    }

    public async tryCommand(roomId: string, event: any): Promise<any> {
        const message = event['content']['body'];
        if (!message || !message.startsWith("!stickers")) return;

        LogService.info("CommandProcessor", "Received command - checking room members");
        const members = await this.client.getJoinedRoomMembers(roomId);
        if (members.length > 2) {
            return this.client.sendNotice(roomId, "It is best to interact with me in a private room.");
        }

        let command = "help";
        const args = message.substring("!stickers".length).trim().split(" ");
        if (args.length > 0) {
            command = args[0];
            args.splice(0, 1);
        }

        if (command === "newpack") {
            if (BuilderRegistry.hasBuilder(roomId)) {
                return this.client.sendNotice(roomId, "Oops! It looks like you're already doing something. Please finish your current operation before creating a new sticker pack.");
            }

            BuilderRegistry.register(roomId, new NewPackBuilder(this.client, roomId)); // sends a welcome message
        } else if (command === "cancel") {
            if (BuilderRegistry.hasBuilder(roomId)) {
                BuilderRegistry.deregister(roomId);
                return this.client.sendNotice(roomId, "Your current operation has been canceled");
            } else return this.client.sendNotice(roomId, "There's nothing for me to cancel");
        } else {
            const htmlMessage = "<p>Sticker bot help:<br /><pre><code>" +
                `!stickers newpack       - Create a new sticker pack\n` +
                `!stickers cancel        - Cancels whatever operation you're doing\n` +
                "!stickers help          - This menu\n" +
                "</code></pre></p>" +
                "<p>For help or more information, visit <a href='https://matrix.to/#/#help:t2bot.io'>#help:t2bot.io</a></p>";
            return this.client.sendMessage(roomId, {
                msgtype: "m.notice",
                body: striptags(htmlMessage),
                format: "org.matrix.custom.html",
                formatted_body: htmlMessage,
            });
        }
    }
}