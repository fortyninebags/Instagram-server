import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn,
Entity,OneToMany,
PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Likes } from "./Likes";
import { Message } from "./Message";
import { Post } from "./Post";
import {Comment} from "./Comment";


@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column()
    username: string;
  
    @Field()
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt:Date;

    @Column("bool", {default: false})
    confirmed: boolean;

    @OneToMany(() => Post, (post) => post.creator)
    posts: Post[];

    @OneToMany(() => Likes, (likes) => likes.user)
    likes: Likes[];

    @Field()
    @Column()
    gender: string;

    @OneToMany(() => Comment, (comment) => comment.creator)
    comment: Comment[];

    @Column({nullable:true})
    profileId: number;
    
    @OneToMany(() => Message, (message) => message.sender)
    message: Message[];
}