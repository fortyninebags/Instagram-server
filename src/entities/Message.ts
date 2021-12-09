import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity,ManyToOne,OneToMany,PrimaryGeneratedColumn} from "typeorm";
import { User } from "./User";
import { Likes } from "./Likes";

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

    @Field(() => Int, { nullable: true })
    messageLikes: number | null; 

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.message)
    sender: User;

    @Field(() => Int)
    @Column()
    receiverId: number;

    @OneToMany(() => Likes, (likes) => likes.message)
    likes: Likes[];
    
  // Could be seen or not
    @Field()
    receivedStatus: string;
} 