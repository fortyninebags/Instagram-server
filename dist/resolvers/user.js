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
const User_1 = require("src/entities/User");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const sendEmail_1 = require("src/utils/sendEmail");
const createConfirmationUrl_1 = require("src/utils/createConfirmationUrl");
const changePasswordInput_1 = require("src/forgotPasswordInput.ts/changePasswordInput");
const redisPrefixes_1 = require("src/prefixes/redisPrefixes");
const redis_1 = require("src/redis");
const constants_1 = require("src/constants");
const isAuth_1 = require("src/middleware/isAuth");
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
    hello() {
        return __awaiter(this, void 0, void 0, function* () {
            return "Hello world";
        });
    }
    register(options, email, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.password.length <= 6)
                return {
                    errors: [{
                            field: "password",
                            message: "Password must be greater than 6"
                        }],
                };
            if (options.username.length <= 6) {
                return {
                    errors: [{
                            field: "username",
                            message: "Username must be greater than 6"
                        }]
                };
            }
            const hashedPassword = yield argon2_1.default.hash(options.password);
            const user = yield User_1.User.create({ username: options.username,
                password: hashedPassword
            }).save();
            yield (0, sendEmail_1.sendEmail)(email, yield (0, createConfirmationUrl_1.createConfirmationUrl)(user.id));
            ctx.req.session.userId = user.id;
            return {
                user
            };
        });
    }
    login(email, password, username, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne(email.includes("@")
                ? { where: { email: email } }
                : { where: { username: username } });
            if (!user) {
                return {
                    errors: [{
                            field: "username",
                            message: "Username already exists",
                        }],
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
    logout(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => ctx.req.session.destroy((err) => {
                if (err) {
                    console.error(err);
                    rej(false);
                    return;
                }
                ctx.res.clearCookie(constants_1.COOKIE_NAME);
                res(true);
            }));
        });
    }
    changePassword({ token, password }, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = yield redis_1.redis.get(redisPrefixes_1.confirmUserPrefix + token);
            if (!userId) {
                return null;
            }
            const user = yield User_1.User.findOne(userId);
            if (!user) {
                return null;
            }
            yield redis_1.redis.del(redisPrefixes_1.forgotPasswordPrefix + token);
            user.password = yield argon2_1.default.hash(password);
            yield user.save();
            ctx.req.session.userId = user.id;
            return user;
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
    (0, type_graphql_1.Query)(() => String),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "hello", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)('options', () => String)),
    __param(1, (0, type_graphql_1.Arg)('email', () => String)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserInput, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)('email', () => String)),
    __param(1, (0, type_graphql_1.Arg)('password', () => String)),
    __param(2, (0, type_graphql_1.Arg)('username', () => String)),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => User_1.User, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('data')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [changePasswordInput_1.changePasswordInput, Object]),
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
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map