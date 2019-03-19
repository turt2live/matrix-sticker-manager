import { StickerPackBuilder } from "./builder";
import { LogService, MatrixClient } from "matrix-bot-sdk";
import { GatherStickersStage } from "./GatherStickersStage";
import * as randomString from "random-string";
import config from "../config";
import { StickerMetadata, StickerStore } from "../db/StickerStore";
import { BuilderRegistry } from "../bot/BuilderRegistry";


export class NewPackBuilder implements StickerPackBuilder {

    private name: string;
    private expectingName = true;
    private gatherStage: GatherStickersStage;

    constructor(private client: MatrixClient, private roomId: string, private store: StickerStore) {
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

    private async createStickerPack(stickers: StickerMetadata[]): Promise<any> {
        const members = await this.client.getJoinedRoomMembers(this.roomId);
        const selfId = await this.client.getUserId();
        const creatorId = members.filter(m => m !== selfId)[0];
        if (!creatorId) throw new Error("Could not find a user ID to own this sticker pack");

        const packId = (randomString({length: 10}) + "-" + this.name.replace(/[^a-zA-Z0-9-]/g, '-')).substring(0, 30);

        const pack = await this.store.createStickerpack({
            id: packId,
            name: this.name,
            creatorId: creatorId,
            stickers: stickers,
        });
        LogService.info("NewPackBuilder", `Pack for ${creatorId} created in room ${pack.roomId}`);

        const slug = `pack/${creatorId}/${packId}`;
        const baseUrl = config.webserver.publicUrl;
        const url = (baseUrl.endsWith("/") ? baseUrl : baseUrl + "/") + slug;
        await this.client.sendNotice(this.roomId, "Awesome! I've created your sticker pack and published it here: " + url);
        BuilderRegistry.deregister(this.roomId);
    }
}