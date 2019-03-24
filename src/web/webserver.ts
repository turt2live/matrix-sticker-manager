import { Appservice, LogService } from "matrix-bot-sdk";
import { StickerStore } from "../db/StickerStore";
import * as path from "path";
import * as exphbs from "express-handlebars";
import * as express from "express";
import config from "../config";

export default class Webserver {

    private static instance: Webserver;

    private app: any;

    constructor(private appservice: Appservice, private store: StickerStore) {
        this.app = (<any>appservice).app; // HACK: Private variable access

        this.app.engine('handlebars', exphbs({defaultLayout: 'main'}));
        this.app.set('view engine', 'handlebars');
        //this.app.set('views', path.join(__dirname, 'views'));

        this.app.get('/pack/:userId/:packId', this.getStickerpack.bind(this));
        this.app.get('/', this.getIndex.bind(this));

        this.app.use(express.static(path.join(__dirname, '..', '..', 'views', 'assets')))
    }

    public static begin(appservice: Appservice, store: StickerStore) {
        if (Webserver.instance) throw new Error("Already started");
        Webserver.instance = new Webserver(appservice, store);
    }

    private async getIndex(req, res) {
        res.status(200).send({"TODO": "This page"});
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
            if (replyJson) {
                res.status(404).send({error: "Pack not found", errcode: "M_NOT_FOUND"});
            } else {
                res.status(404).render('404', {layout: 'error'});
            }
            return;
        }

        if (pack.creatorId !== userId) {
            if (replyJson) {
                res.status(400).send({error: "Creator != requested user ID", errcode: "M_BAD_REQUEST"});
            } else {
                res.status(400).render('404', {layout: 'error'});
            }
            return;
        }

        if (replyJson) {
            LogService.info("Webserver", "Serving JSON for pack " + pack.id);
            res.send({
                version: 1,
                type: "m.stickerpack",
                name: pack.name,
                id: pack.id, // arbitrary
                creator: {
                    type: "mx-user",
                    id: pack.creatorId,
                },
                author: {
                    type: "external",
                    name: pack.authorName,
                    ref: pack.authorUrl,
                },
                licenseName: pack.license,
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
                "io.t2bot.dimension": {
                    id: pack.id,
                    creatorId: pack.creatorId,
                    roomId: pack.roomId,
                    roomAlias: pack.roomAlias,
                    licenseName: pack.license,
                    author: {
                        name: pack.authorName,
                        url: pack.authorUrl,
                    },
                },
            });
            return;
        }

        const renderVars = JSON.parse(JSON.stringify(pack));
        renderVars.stickers = renderVars.stickers.map(s => Object.assign({
            contentUrl: `${config.appservice.homeserverUrl}/_matrix/media/r0/download/${s.contentUri.substring("mxc://".length)}`,
        }, s));
        res.render('stickerpack', {pack: renderVars});
    }
}