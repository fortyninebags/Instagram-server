"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentResolver = exports.CommentInput = void 0;
const Comment_1 = require("../entities/Comment");
const type_graphql_1 = require("type-graphql");
const isAuth_1 = require("../middleware/isAuth");
const typeorm_1 = require("typeorm");
let CommentInput = class CommentInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], CommentInput.prototype, "body", void 0);
CommentInput = __decorate([
    (0, type_graphql_1.InputType)()
], CommentInput);
exports.CommentInput = CommentInput;
let PaginatedComments = class PaginatedComments {
};
__decorate([
    (0, type_graphql_1.Field)(() => Comment_1.Comment),
    __metadata("design:type", Array)
], PaginatedComments.prototype, "comments", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Boolean)
], PaginatedComments.prototype, "hasMore", void 0);
PaginatedComments = __decorate([
    (0, type_graphql_1.ObjectType)()
], PaginatedComments);
let CommentResolver = class CommentResolver {
    createComment(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            return Comment_1.Comment.create(Object.assign(Object.assign({}, input), { creatorId: req.session.userId })).save();
        });
    }
    updateComment(id, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield Comment_1.Comment.findOne(id);
            if (!comment) {
                throw new Error("Comment does not exist");
            }
            if (input.body) {
                yield Comment_1.Comment.update({ id }, {
                    body: input.body
                });
                yield comment.save();
            }
            return comment;
        });
    }
    deleteComment(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Comment_1.Comment.delete({ id, creatorId: req.session.userId });
            return true;
        });
    }
    comments(limit, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            const realLimit = Math.min(6, limit);
            const realLimitPlusOne = realLimit + 1;
            const replacements = [realLimitPlusOne];
            if (cursor) {
                replacements.push(new Date(parseInt(cursor)));
            }
            const comments = yield (0, typeorm_1.getConnection)().query(`
   // select all fields from the table
   select c.*, 
   from comment c
   ${cursor ? `where c."createdAt" < $2` : ""}
   // SORTS BY THE NEWEST 
   order by c."createdAt" DSC
   limit $1
   `, replacements);
            return {
                comments: comments.slice(0, realLimit),
                hasMore: comments.length === realLimitPlusOne
            };
        });
    }
    likeComment(commentId, value, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const isLiked = value !== null;
            const realValue = isLiked ? 1 : -1;
            const userId = req.session.userId;
            (0, typeorm_1.getConnection)().query(`
   START TRANSACTION;

   insert into likes("userId", "commentId","value")
   values(${userId},${commentId},${realValue})

   update comment
   set commentLikes = commentLikes + ${realValue}
   where id = ${commentId}

   COMMIT;
  `);
            yield Comment_1.Comment.update({
                id: commentId,
            }, {});
            return true;
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => Comment_1.Comment, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("input")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommentInput, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "createComment", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Comment_1.Comment, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, CommentInput]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "updateComment", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "deleteComment", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Comment_1.Comment]),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("limit", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("cursor", () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "comments", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('commentId', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('value', () => type_graphql_1.Int)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "likeComment", null);
CommentResolver = __decorate([
    (0, type_graphql_1.Resolver)(Comment_1.Comment)
], CommentResolver);
exports.CommentResolver = CommentResolver;
//# sourceMappingURL=comment.js.map