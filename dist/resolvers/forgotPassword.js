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
exports.forgotPasswordResolver = void 0;
const User_1 = require("../entities/User");
const isAuth_1 = require("../middleware/isAuth");
const redisPrefixes_1 = require("../prefixes/redisPrefixes");
const redis_1 = require("../redis");
const sendEmail_1 = require("../utils/sendEmail");
const type_graphql_1 = require("type-graphql");
const uuid_1 = require("uuid");
let forgotPasswordResolver = class forgotPasswordResolver {
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { email } });
            if (!user) {
                return "Incorrect email";
            }
            const token = (0, uuid_1.v4)();
            yield redis_1.redis.set(redisPrefixes_1.forgotPasswordPrefix + token, user.id, "ex", 60 * 60 * 24);
            yield (0, sendEmail_1.sendEmail)(email, `http://localhost:3000/user/change-password/${token}`);
            return "Password changed successfully";
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => String),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], forgotPasswordResolver.prototype, "forgotPassword", null);
forgotPasswordResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], forgotPasswordResolver);
exports.forgotPasswordResolver = forgotPasswordResolver;
//# sourceMappingURL=forgotPassword.js.map