import { Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    tableName: "stickerpacks",
    underscoredAll: false,
    timestamps: false,
})
export default class Stickerpack extends Model<Stickerpack> {
    @PrimaryKey
    @Column
    id: string;

    @Column
    creatorId: string;

    @Column
    name: string;
}