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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = exports.UserResponse = exports.ErrorField = exports.UserInput = void 0;
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const sendEmail_1 = require("../utils/sendEmail");
const createConfirmationUrl_1 = require("../utils/createConfirmationUrl");
const redisPrefixes_1 = require("../prefixes/redisPrefixes");
const constants_1 = require("../constants");
const isAuth_1 = require("../middleware/isAuth");
const typeorm_1 = require("typeorm");
let UserInput = class UserInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "username", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "email", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], UserInput.prototype, "password", void 0);
UserInput = __decorate([
    (0, type_graphql_1.InputType)()
], UserInput);
exports.UserInput = UserInput;
let ErrorField = class ErrorField {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], ErrorField.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], ErrorField.prototype, "message", void 0);
ErrorField = __decorate([
    (0, type_graphql_1.ObjectType)()
], ErrorField);
exports.ErrorField = ErrorField;
let UserResponse = class UserResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [ErrorField], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResponse);
exports.UserResponse = UserResponse;
let UserResolver = class UserResolver {
    register(options, email, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield argon2_1.default.hash(options.password);
            let user;
            try {
                const result = yield (0, typeorm_1.getConnection)()
                    .createQueryBuilder()
                    .insert()
                    .into(User_1.User)
                    .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,
                })
                    .returning("*")
                    .execute();
                user = result.raw[0];
            }
            catch (err) {
                if (err.code === "23505") {
                    return {
                        errors: [
                            {
                                field: "username",
                                message: "username already taken",
                            },
                        ],
                    };
                }
            }
            yield (0, sendEmail_1.sendEmail)(email, yield (0, createConfirmationUrl_1.createConfirmationUrl)(user.id));
            ctx.req.session.userId = user.id;
            return {
                user
            };
        });
    }
    login(usernameOrEmail, password, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne(usernameOrEmail.includes("@")
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } });
            if (!user) {
                return {
                    errors: [
                        {
                            field: "usernameOrEmail",
                            message: "that username doesn't exist",
                        },
                    ],
                };
            }
            const valid = yield argon2_1.default.verify(user.password, password);
            if (!valid) {
                return {
                    errors: [{
                            field: "password",
                            message: "Incorrect password",
                        }],
                };
            }
            if (!user.confirmed) {
                return {
                    errors: [{
                            field: "email",
                            message: "Confirm your email before proceeding"
                        }],
                };
            }
            ctx.req.session.userId = user.id;
            return {
                user
            };
        });
    }
    logout({ req, res }) {
        return new Promise((resolve) => req.session.destroy((err) => {
            res.clearCookie(constants_1.COOKIE_NAME);
            if (err) {
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
        }));
    }
    changePassword(token, newPassword, { redis, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length <= 6) {
                return {
                    errors: [
                        {
                            field: "newPassword",
                            message: "Length must be greater than 6",
                        },
                    ],
                };
            }
            const key = redisPrefixes_1.forgotPasswordPrefix + token;
            const userId = yield redis.get(key);
            if (!userId) {
                return {
                    errors: [
                        {
                            field: "token",
                            message: "Token expired",
                        },
                    ],
                };
            }
            const userIdNum = parseInt(userId);
            const user = yield User_1.User.findOne(userIdNum);
            if (!user) {
                return {
                    errors: [
                        {
                            field: "token",
                            message: "User no longer exists",
                        },
                    ],
                };
            }
            yield User_1.User.update({ id: userIdNum }, {
                password: yield argon2_1.default.hash(newPassword),
            });
            yield redis.del(key);
            req.session.userId = user.id;
            return { user };
        });
    }
    ;
    changeUsername(change, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.session.userId;
            const user = yield User_1.User.findOne({ where: { userId } });
            if (change.username.length <= 6) {
                return {
                    errors: [{
                            field: 'username',
                            message: 'Username must be greater than 6'
                        },
                    ],
                };
            }
            if (user) {
                user.username = change.username;
                user.save();
            }
            return {
                user
            };
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)('options', () => String)),
    __param(1, (0, type_graphql_1.Arg)('email')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserInput, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)("usernameOrEmail")),
    __param(1, (0, type_graphql_1.Arg)('password', () => String)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("token")),
    __param(1, (0, type_graphql_1.Arg)("newPassword")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('change')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changeUsername", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map