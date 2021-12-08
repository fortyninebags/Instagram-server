import { BaseEntity, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Profile extends BaseEntity {
    @PrimaryGeneratedColumn()
     id: number;
}