import {Query, Resolver} from "type-graphql";

@Resolver()
export class HelloResolver {
    @Query(() => String )
    hello(){
        return  "fucking error throwing bitch";
    }
}