import { MyContext } from "../constants/MyContext";
import { Message } from "../entities/Message";
import { isAuth } from "../middleware/isAuth";
import { Arg, Ctx, Field,
InputType, Int, 
Mutation,Resolver,
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
   
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likeMessage(
  @Arg('messageId', () => Int) messageId:number,
  @Arg('value',() => Int) value: number,
  @Ctx() { req }: MyContext 
  ) {
  const isLiked = value !== null
  const realValue = isLiked ? 1 : null
  const userId = req.session!.userId

  getConnection().query(`
   START TRANSACTION;

   insert into likes("userId", "messageId","value")
   values(${userId},${messageId},${realValue})

   update message
   set messageLikes = messageLikes + ${realValue}
   where id = ${messageId}

   COMMIT;
  `)
  await Message.update(
    {
      id:messageId,
  },
  {}
  );
  return true;
   }
}