import * as config from "config";

interface IConfig {
    appservice: {
        domainName: string;
        homeserverUrl: string;
        asToken: string;
        hsToken: string;
    };
    webserver: {
        port: number;
        bind: string;
        publicUrl: string;
    };
    media: {
        useLocalCopy: boolean;
        useMediaInfo: boolean;
    };
    dataPath: string;
}

export default <IConfig>config;