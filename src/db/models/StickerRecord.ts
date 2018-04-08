import { Column, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Stickerpack from "./Stickerpack";

@Table({
    tableName: "stickers",
    underscoredAll: false,
    timestamps: false,
})
export default class StickerRecord extends Model<StickerRecord> {
    @PrimaryKey
    @Column
    id: number;

    @Column
    @ForeignKey(() => Stickerpack)
    packId: string;

    @Column
    description: string;

    @Column
    contentUri: string;
}