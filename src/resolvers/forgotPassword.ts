
import { User } from "src/entity/User";
import { isAuth } from "src/middleware/isAuth";
import { forgotPasswordPrefix } from "src/prefixes/redisPrefixes";
import { redis } from "src/redis";
import { sendEmail } from "src/utils/sendEmail";
import { Arg, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { v4 } from "uuid";


@Resolver()
export class forgotPasswordResolver{
    @Mutation(() => String)
    @UseMiddleware(isAuth)
    async forgotPassword(
    @Arg("email") email: string
    ):Promise<String> {
        const user = await User.findOne({where:{email}})
        if(!user){
            return "Incorrect email" 
        }
        const token = v4()
        await redis.set(forgotPasswordPrefix + token,user.id,"ex",60*60*24)
        await sendEmail(email,`http://localhost:3000/user/change-password/${token}`);

        return "Password changed successfully"
    }
 }