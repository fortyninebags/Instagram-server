import { User } from "src/entity/User";
import { redis } from "src/redis";
import { Arg, Mutation, Resolver } from "type-graphql";


@Resolver()
export class ConfirmUserResolver {
    @Mutation(() => Boolean)
    async confirmUser(
    @Arg("token") token: string
    ):Promise<Boolean> {
        const userId = await redis.get(token);
        if(!userId){
          return false
        }
        
        // if the user has confirmed gets rid of the token since it is pointless
        // to confirm multiple times
        await User.update({id: parseInt(userId,10)}, {confirmed: true});
        await redis.del(token)

        return true
    }
  }