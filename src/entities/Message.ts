import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity,ManyToOne,PrimaryGeneratedColumn} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Message extends BaseEntity{
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    body: string;

    @Field(() => Int)
    @Column()
    creatorId: number;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.message)
    sender: User;

    @Field(() => Int)
    @Column()
    receiverId: number;
    
  // Could be seen or not
    @Field()
    status: string;
} 