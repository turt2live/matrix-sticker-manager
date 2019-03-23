import { LogService, MatrixClient } from "matrix-bot-sdk";
import { StickerPackBuilder } from "./builder";

export interface LicenseOption {
    name: string;
    url: string;
}

export const APPROVED_LICENSES: LicenseOption[] = [
    {name: "CC BY-NC 4.0", url: "https://creativecommons.org/licenses/by-nc/4.0/"},
    {name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/"},
    {name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0"},
    {name: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0"},
];

export class StickerLicenseStage implements StickerPackBuilder {

    public license: LicenseOption;
    private resolveFn: (license: LicenseOption) => void;

    constructor(private client: MatrixClient, private roomId: string) {
    }

    public start(): Promise<LicenseOption> {
        return this.sendLicenseOptions().then(() => {
            const promise = new Promise((resolve, _reject) => {
                this.resolveFn = resolve;
            });
            return (<any>promise);
        });
    }

    private sendLicenseOptions(): Promise<any> {
        return this.client.sendNotice(this.roomId, "Here are the licenses I support:\n\n" + APPROVED_LICENSES.map(al => al.name + " - " + al.url).join("\n"));
    }

    public async handleEvent(event: any): Promise<any> {
        if (event['type'] === "m.room.message" && event['content']['msgtype'] === "m.text") {
            const chosenLicense = event['content']['body'] || "";
            const license = APPROVED_LICENSES.find(al => al.name.toLowerCase() === chosenLicense.trim().toLowerCase());
            if (!license) {
                return this.client.sendNotice(this.roomId, "Sorry! I don't recognize that license.").then(() => this.sendLicenseOptions());
            }

            LogService.info("StickerLicenseStage", "Finished getting license for " + this.roomId);
            this.license = license;
            this.resolveFn(this.license);
        }

        return Promise.resolve();
    }
}