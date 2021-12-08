import { Request,Response } from "express";
import { Redis } from "ioredis";
import { createLikeLoader } from "../utils/createLikesLoader";
import { createUserLoader } from "../utils/createUserLoader";

export interface MyContext {
  req: Request;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>
  likesLoader: ReturnType<typeof createLikeLoader>
}