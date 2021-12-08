import { MyContext } from "../constants/MyContext";
import { User } from "../entities/User";
import { Ctx, Query, Resolver } from "type-graphql";


@Resolver()
export class MeResolver{
    @Query(() => User, {nullable: true})
    async me(@Ctx() ctx: MyContext):Promise<User | undefined>{
        // checks if the user exists
        if(!ctx.req.session!.userId){
            return undefined
        }
  // if he does fetches him
        return await User.findOne(ctx.req.session!.userId)
    }
}