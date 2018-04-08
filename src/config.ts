import * as config from "config";
import { LogConfig } from "matrix-js-snippets";

interface IConfig {
    homeserverUrl: string;
    accessToken: string;
    webserver: {
        port: number;
        bind: string;
        publicUrl: string;
    };
    media: {
        useLocalCopy: boolean;
        useMediaInfo: boolean;
    };
    database: {
        file: string;
    };
    logging: LogConfig;
}

export default <IConfig>config;