import { Model, Sequelize } from "sequelize-typescript";
import { LogService } from "matrix-js-snippets";
import config from "../config";
import * as path from "path";
import * as Umzug from "umzug";
import Stickerpack from "./models/Stickerpack";
import Sticker from "./models/StickerRecord";

class _StickerStore {
    private sequelize: Sequelize;

    constructor() {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            database: "stickerbot",
            storage: config.database.file,
            username: "",
            password: "",
            logging: i => LogService.verbose("StickerStore [SQL]", i)
        });
        this.sequelize.addModels(<Array<typeof Model>>[
            Sticker,
            Stickerpack,
        ]);
    }

    public updateSchema(): Promise<any> {
        LogService.info("StickerStore", "Updating schema...");

        const migrator = new Umzug({
            storage: "sequelize",
            storageOptions: {sequelize: this.sequelize},
            migrations: {
                params: [this.sequelize.getQueryInterface()],
                path: path.join(__dirname, "migrations"),
            },
        });

        return migrator.up();
    }
}

export const StickerStore = new _StickerStore();