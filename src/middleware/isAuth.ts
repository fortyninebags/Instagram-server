import { MyContext } from "../constants/MyContext";
import {MiddlewareFn} from "type-graphql";

export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    if(!context.req.session!.userId){
        throw new Error("Not authenticated")
    }

    return next();
};