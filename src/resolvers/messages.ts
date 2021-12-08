import { MyContext } from "src/constants/MyContext";
import { Message } from "src/entities/Message";
import { isAuth } from "src/middleware/isAuth";
import { Arg, Ctx, Field,
 InputType, Int, Mutation, Query, Resolver,
UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";


@InputType()
export class MessageInput{
    @Field()
    body:string;
}

@Resolver(Message)
export class MessageResolver{
    @Mutation(() => Message,{nullable: true})
    @UseMiddleware(isAuth)
    async createMessage(
        @Arg("input") input: MessageInput,
        @Ctx() { req }: MyContext
      ): Promise<Message | null> {
        return Message.create({
          ...input,
          creatorId: req.session!.userId,
        }).save();
   }
   @Mutation(() => Message,{nullable: true})
   @UseMiddleware(isAuth)
   async updateMessage(
       @Arg('id', () => Int) id: number,
       @Arg('input') input: MessageInput
   ):Promise<Message | undefined> {
    const message = await Message.findOne(id)
    if(message) {
     await Message.update(id,{
        body: input.body
     })
    }
    return message;
   }
   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deleteMessage(
       @Arg('id', () => Int) id:number,
       @Ctx() { req }: MyContext
   ):Promise<boolean>{
    await Message.delete({ id, creatorId: req.session!.userId });
    return true;
   }
   @Query(() => [Message]) 
  async messages(
    // // limits for showable posts
    @Arg("limit",() => Int) limit:number,
    // the date the post is created
    @Arg("cursor", {nullable:true}) cursor: string | null
  ):Promise<Message[]> {
   const realLimit = Math.min(50,limit)
   const qb = getConnection()
   .getRepository(Message)
   .createQueryBuilder("m")
   // sorts them by the newest post
   // double quotes in order to keep the A IN CAMEL CASE
   .orderBy('"createdAt"',"ASC")
   .take(realLimit)
   if(cursor){
     qb.where('"createdAt" < :cursor',{
       cursor: new Date(parseInt(cursor)),
      });
   }
   return qb.getMany();
  } 
}