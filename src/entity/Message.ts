import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity,PrimaryGeneratedColumn} from "typeorm";



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

    @Field(() => Int)
    @Column()
    receiverId: number;
    
  // Could be seen or not
    @Field()
    status: string;
} 