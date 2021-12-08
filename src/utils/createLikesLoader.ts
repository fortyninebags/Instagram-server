import DataLoader from "dataloader"
import { Likes } from "src/entities/Likes"


export const createLikeLoader = () =>
new DataLoader<{postId: number, userId: number},Likes | null>(async keys => {
    const likes = await Likes.findByIds(keys as any)
    const likesIdToLikes: Record<string,Likes> = {}
    likes.forEach( likes => {
       likesIdToLikes[`${likes.userId} ${likes.postId}`] = likes;
    });
    
  return likes.map((key) => likesIdToLikes[`${key.userId} ${key.postId}`])
});