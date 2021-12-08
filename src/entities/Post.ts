import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Likes } from "./Likes";
import { User } from "./User";
import {Comment} from  "./Comment";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;   

    @Field({nullable : true})
    @Column()
    description?: string;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @Column({ type: "int", default: 0 })
    postLikes!: number;

    @Field(() => Int)
    @Column()
    creatorId: number;

    @Field(() => Int, { nullable: true })
    likeStatus: number | null; 

    @ManyToOne(() => User, (user) => user.posts)
    creator: User;

    @OneToMany(() => Likes, (likes) => likes.post)
    likes: Likes[];
  
    @OneToMany(() => Comment, (comment) => comment.post)
    comment: Comment[];
}
