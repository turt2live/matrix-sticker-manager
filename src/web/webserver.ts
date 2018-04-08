import * as express from "express";
import config from "../config";
import { LogService } from "matrix-js-snippets";
import Stickerpack from "../db/models/Stickerpack";
import StickerRecord from "../db/models/StickerRecord";

class _Webserver {
    private app: any;

    constructor() {
        this.app = express();

        this.app.get('/:userId/:packId', this.getStickerpack.bind(this));

        // TODO: Serve a home page of some kind. Stickerpack browser?
    }

    public start() {
        this.app.listen(config.webserver.port, config.webserver.bind, () => {
            LogService.info("webserver", "Listening on " + config.webserver.bind + ":" + config.webserver.port);
        });
    }

    private async getStickerpack(req, res) {
        const accept = (req.headers['accept'] || "");
        const params = (req.params || {});
        const userId = params['userId'];
        let packId = params['packId'];

        const replyJson = accept.indexOf("application/json") !== -1 || packId.endsWith(".json");
        if (packId.endsWith(".json")) packId = packId.substring(0, packId.length - ".json".length);

        const pack = await Stickerpack.findOne({where: {creatorId: userId, id: packId}});
        if (!pack) {
            // TODO: A real 404 page
            res.status(404);
            res.send({"TODO": "A real 404 page"});
            return;
        }

        const stickers = await StickerRecord.findAll({where: {packId: pack.id}});

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
                stickers: stickers.map(s => {
                    return {
                        id: s.id, // arbitrary
                        description: s.description,
                        contentUri: s.contentUri,
                    };
                }),
            });
            return;
        }

        // TODO: A real preview page
        res.send({"TODO": "A real preview page"});
    }
}

export const Webserver = new _Webserver();