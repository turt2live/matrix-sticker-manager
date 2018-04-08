import { QueryInterface } from "sequelize";
import { DataType } from "sequelize-typescript";

export default {
    up: (queryInterface: QueryInterface) => {
        return Promise.resolve()
            .then(() => queryInterface.createTable("stickerpacks", {
                "id": {type: DataType.STRING, primaryKey: true, allowNull: false},
                "creatorId": {type: DataType.STRING,  allowNull: false},
                "name": {type: DataType.STRING, allowNull: false},
            }))
            .then(() => queryInterface.createTable("stickers", {
                "id": {type: DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
                "packId": {
                    type: DataType.STRING,
                    allowNull: false,
                    references: {model: "stickerpacks", key: "id"},
                    onUpdate: "cascade", onDelete: "cascade",
                },
                "description": {type: DataType.STRING, allowNull: false},
                "contentUri": {type: DataType.STRING, allowNull: false},
            }));
    },
    down: (queryInterface: QueryInterface) => {
        return Promise.resolve()
            .then(() => queryInterface.dropTable("stickers"))
            .then(() => queryInterface.dropTable("stickerpacks"));
    }
}