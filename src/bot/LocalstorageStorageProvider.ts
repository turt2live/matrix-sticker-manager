import { IFilterInfo, IStorageProvider } from "matrix-bot-sdk";
import { LocalStorage } from "node-localstorage";
import * as mkdirp from "mkdirp";

export class LocalstorageStorageProvider implements IStorageProvider {

    private kvStore: Storage;

    constructor(path: string) {
        mkdirp.sync(path);
        this.kvStore = new LocalStorage(path, 100 * 1024 * 1024); // quota is 100mb
    }

    setSyncToken(token: string | null): void {
        this.kvStore.setItem("sync_token", token);
    }

    getSyncToken(): string | null {
        return this.kvStore.getItem("sync_token");
    }

    setFilter(filter: IFilterInfo): void {
        // Do nothing
    }

    getFilter(): IFilterInfo {
        return null;
    }
}