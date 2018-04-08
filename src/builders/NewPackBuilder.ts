import { StickerPackBuilder } from "./builder";
import { MatrixClient } from "matrix-bot-sdk";
import { GatherStickersStage, Sticker } from "./GatherStickersStage";
import * as randomString from "random-string";
import Stickerpack from "../db/models/Stickerpack";
import StickerRecord from "../db/models/StickerRecord";
import config from "../config";


export class NewPackBuilder implements StickerPackBuilder {

    private name: string;
    private expectingName = true;
    private gatherStage: GatherStickersStage;

    constructor(private client: MatrixClient, private roomId: string) {
        client.sendNotice(roomId, "Woot! A new sticker pack. What should we call it?");
        this.gatherStage = new GatherStickersStage(client, roomId);
    }

    public async handleEvent(event: any): Promise<any> {
        if (this.expectingName) {
            if (event['type'] !== "m.room.message" || !event['content']['body'] || event['content']['msgtype'] !== "m.text") {
                return this.client.sendNotice(this.roomId, "Not quite the type of name I was expecting. Let's start with what we should call your new pack. To give it a name, just send me a message with your pack's name.");
            }

            this.name = event['content']['body'];
            this.expectingName = false;
            this.gatherStage.start().then(stickers => this.createStickerPack(stickers));
            return this.client.sendNotice(this.roomId, "Thanks! Now send me your first sticker. The image should be a PNG image (with a transparent background) and should be 512x512.\n\nThe sticker should also have a white border around it.");
        } else {
            return this.gatherStage.handleEvent(event);
        }
    }

    private async createStickerPack(stickers: Sticker[]): Promise<any> {
        const members = await this.client.getJoinedRoomMembers(this.roomId);
        const selfId = await this.client.getUserId();
        const creatorId = members.filter(m => m !== selfId)[0];
        if (!creatorId) throw new Error("Could not find a user ID to own this sticker pack");

        const packId = (randomString({length: 10}) + "-" + this.name.replace(/[^a-zA-Z0-9-]/g, '-')).substring(0, 30);
        const pack = await Stickerpack.create({id: packId, creatorId: creatorId, name: this.name});

        for (const sticker of stickers) {
            await StickerRecord.create({
                packId: packId,
                description: sticker.description,
                contentUri: sticker.contentUri,
            });
        }

        const slug = `${creatorId}/${packId}`;
        const baseUrl = config.webserver.publicUrl;
        const url = (baseUrl.endsWith("/") ? baseUrl : baseUrl + "/") + slug;
        return this.client.sendNotice(this.roomId, "Awesome! I've created your sticker pack and published it here: " + url);
    }
}