import { LogService, MatrixClient } from "matrix-bot-sdk";
import { StickerPackBuilder } from "./builder";
import config from "../config";
import { StickerMetadata } from "../db/StickerStore";

export class GatherStickersStage implements StickerPackBuilder {

    public stickers: StickerMetadata[] = [];
    private currentSticker: StickerMetadata = {description: "", contentUri: ""};
    private expectingImage = true;
    private resolveFn: (stickers: StickerMetadata[]) => void;

    constructor(private client: MatrixClient, private roomId: string) {
    }

    public start(): Promise<StickerMetadata[]> {
        return new Promise((resolve, _reject) => {
            this.resolveFn = resolve;
        });
    }

    public async handleEvent(event: any): Promise<any> {
        if (event['type'] === "m.room.message" && event['content']['msgtype'] === "m.text") {
            if (event['content']['body'] === "!done") {
                LogService.info("GatherStickersStage", "Finished sticker gathering for " + this.roomId);
                this.resolveFn(this.stickers);
                return Promise.resolve();
            }

            if (!this.expectingImage) {
                this.currentSticker.description = event['content']['body'];
                this.stickers.push(this.currentSticker);
                this.currentSticker = {description: "", contentUri: ""};
                this.expectingImage = true;
                LogService.info("GatherStickersStage", "A sticker has been completed, but not submitted in " + this.roomId);
                return this.client.sendNotice(this.roomId, "Thanks! Send me another 512x512 PNG for your next sticker or say !done if you've finished.");
            }
        }

        if (event['type'] !== "m.room.message" || !event['content']['url'] || event['content']['msgtype'] !== "m.image") {
            LogService.warn("GatherStickersStage", "Event does not look to be an image event in " + this.roomId);
            return this.client.sendNotice(this.roomId, "That doesn't look like an image to me. Please send a 512x512 PNG of the sticker you'd like to add.");
        }

        const mxc = event['content']['url'];
        if (!mxc.startsWith("mxc://")) {
            LogService.warn("GatherStickersStage", "Not an MXC URI in " + this.roomId);
            return this.client.sendNotice(this.roomId, "That doesn't look like a valid image, sorry.");
        }

        const mxcParts = mxc.substring("mxc://".length).split("/");
        const origin = mxcParts[0];
        const mediaId = mxcParts[1];
        if (!origin || !mediaId) {
            LogService.warn("GatherStickersStage", "Invalid format for content URI in " + this.roomId);
            return this.client.sendNotice(this.roomId, "That doesn't look like a valid image, sorry.");
        }

        if (config.media.useMediaInfo) {
            try {
                LogService.info("GatherStickersStage", "Requesting media info for " + mxc);
                const response = await this.client.doRequest("GET", "/_matrix/media/unstable/info/" + origin + "/" + mediaId);
                if (response['content_type'] !== "image/png" || !response['width'] || !response['height']) {
                    LogService.warn("GatherStickersStage", "Media info for " + mxc + " indicates the file is invalid in " + this.roomId);
                    return this.client.sendNotice(this.roomId, "Please upload a PNG image for your sticker.");
                }
            } catch (err) {
                LogService.error("GatherStickersStage", "Error requesting media info:");
                LogService.error("GatherStickersStage", err);
                return this.client.sendNotice(this.roomId, "Something went wrong while checking your sticker. Please try again.");
            }
        } else {
            if (!event['content']['info']) {
                LogService.warn("GatherStickersStage", "Event is missing media info in " + this.roomId);
                return this.client.sendNotice(this.roomId, "Your client didn't send me enough information for me to validate your sticker. Please try again or use a different client.");
            }
            if (event['content']['info']['mimetype'] !== "image/png") {
                LogService.warn("GatherStickersStage", "Media info from event indicates the file is not an image in " + this.roomId);
                return this.client.sendNotice(this.roomId, "Please upload a PNG image for your sticker.");
            }
        }

        let contentUri = "mxc://" + origin + "/" + mediaId;
        if (config.media.useLocalCopy) {
            try {
                LogService.info("GatherStickersStage", "Requesting local copy of " + contentUri);
                const response = await this.client.doRequest("GET", "/_matrix/media/unstable/local_copy/" + origin + "/" + mediaId);
                contentUri = response["content_uri"];
                LogService.info("GatherStickersStage", "Local copy for " + mxc + " is " + contentUri);
            } catch (err) {
                LogService.error("GatherStickersStage", "Error getting local copy:");
                LogService.error("GatherStickersStage", err);
                return this.client.sendNotice(this.roomId, "Something went wrong with handling your sticker. Please try again.");
            }
        }

        this.currentSticker = {
            description: "",
            contentUri: contentUri,
        };
        this.expectingImage = false;
        LogService.info("GatherStickersStage", "Asking for a description for the uploaded image in " + this.roomId);
        return this.client.sendNotice(this.roomId, "Great! In a few words, please describe your sticker.");
    }
}