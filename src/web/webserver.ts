import { Appservice, LogService } from "matrix-bot-sdk";
import { StickerStore } from "../db/StickerStore";

export default class Webserver {

    private static instance: Webserver;

    private app: any;

    constructor(private appservice: Appservice, private store: StickerStore) {
        this.app = (<any>appservice).app; // HACK: Private variable access

        this.app.get('/pack/:userId/:packId', this.getStickerpack.bind(this));

        // TODO: Serve a home page of some kind. Stickerpack browser?
    }

    public static begin(appservice: Appservice, store: StickerStore) {
        if (Webserver.instance) throw new Error("Already started");
        Webserver.instance = new Webserver(appservice, store);
    }

    private async getStickerpack(req, res) {
        const accept = (req.headers['accept'] || "");
        const params = (req.params || {});
        const userId = params['userId'];
        let packId = params['packId'];

        const replyJson = accept.indexOf("application/json") !== -1 || packId.endsWith(".json");
        if (packId.endsWith(".json")) packId = packId.substring(0, packId.length - ".json".length);

        const pack = await this.store.getStickerpack(packId);
        if (!pack) {
            // TODO: A real 404 page
            res.status(404);
            res.send({"TODO": "A real 404 page"});
            return;
        }

        if (pack.creatorId !== userId) {
            // TODO: A real 400 page
            res.status(400);
            res.send({"TODO": "A real 400 page"});
            return;
        }

        if (replyJson) {
            LogService.info("Webserver", "Serving JSON for pack " + pack.id);
            res.send({
                version: 1,
                type: "m.stickerpack",
                name: pack.name,
                id: pack.id, // arbitrary
                author: {
                    type: "mx-user",
                    id: pack.creatorId,
                },
                stickers: pack.stickers.map(s => {
                    return {
                        id: s.id, // arbitrary
                        description: s.description,
                        contentUri: s.contentUri,
                    };
                }),
                subscription: {
                    roomId: pack.roomId,
                    roomAlias: pack.roomAlias,
                    public: true,
                },
            });
            return;
        }

        // TODO: A real preview page
        res.send({"TODO": "A real preview page"});
    }
}