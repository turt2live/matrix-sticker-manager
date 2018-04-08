import { StickerPackBuilder } from "../builders/builder";

class _BuilderRegistry {
    private roomIdToBuilder: { [roomId: string]: StickerPackBuilder } = {};

    public register(roomId: string, builder: StickerPackBuilder): void {
        if (this.roomIdToBuilder[roomId]) {
            throw new Error("An operation is already in progress");
        }

        this.roomIdToBuilder[roomId] = builder;
    }

    public deregister(roomId: string): void {
        delete this.roomIdToBuilder[roomId];
    }

    public handleEvent(roomId: string, event: any): Promise<any> {
        if (this.roomIdToBuilder[roomId]) {
            return this.roomIdToBuilder[roomId].handleEvent(event);
        } else return Promise.resolve();
    }

    public hasBuilder(roomId: string): boolean {
        return !!this.roomIdToBuilder[roomId];
    }
}

export const BuilderRegistry = new _BuilderRegistry();