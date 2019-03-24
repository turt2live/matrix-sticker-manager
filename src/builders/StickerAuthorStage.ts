import { MatrixClient } from "matrix-bot-sdk";
import { StickerPackBuilder } from "./builder";

export interface AuthorInformation {
    authorName: string;
    authorUrl: string;
}

export class StickerAuthorStage implements StickerPackBuilder {

    public authorName: string;
    public authorUrl: string;
    private resolveFn: (author: AuthorInformation) => void;

    constructor(private client: MatrixClient, private roomId: string) {
    }

    public start(): Promise<AuthorInformation> {
        return new Promise((resolve, _reject) => {
            this.resolveFn = resolve;
        });
    }

    public async handleEvent(event: any): Promise<any> {
        if (event['type'] === "m.room.message" && event['content']['msgtype'] === "m.text") {
            const body = event['content']['body'] || "";
            if (!body) return Promise.resolve();

            if (body === "me" || body === "myself") {
                this.authorName = null;
                this.authorUrl = null;
                this.resolveFn({authorName: this.authorName, authorUrl: this.authorUrl});
                return Promise.resolve();
            }

            if (!this.authorName) {
                this.authorName = body;
                return this.client.sendNotice(this.roomId, "Great! I'll credit this sticker pack to " + this.authorName + " - what URL would they like to be shared?");
            }

            if (!body.startsWith("https://")) {
                return this.client.sendNotice(this.roomId, "Sorry, I was expecting a URL where the author wants to be credited.");
            }

            this.authorUrl = body;
            this.resolveFn({authorName: this.authorName, authorUrl: this.authorUrl});
        }

        return Promise.resolve();
    }
}