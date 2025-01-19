"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModule = void 0;
const common_1 = require("@nestjs/common");
const comment_controller_1 = require("./comment.controller");
const comment_service_1 = require("./comment.service");
const comment_provider_1 = require("./comment.provider");
const database_module_1 = require("../database/database.module");
const roles_module_1 = require("../roles/roles.module");
const complaint_module_1 = require("../complaint/complaint.module");
const requestServices_module_1 = require("../requestServices/requestServices.module");
const touch_points_module_1 = require("../touchpoint/touch-points.module");
let CommentModule = class CommentModule {
};
exports.CommentModule = CommentModule;
exports.CommentModule = CommentModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, roles_module_1.RolesModule, requestServices_module_1.RequestServicesModule, touch_points_module_1.TouchPointsModule, complaint_module_1.ComplaintsModule],
        controllers: [comment_controller_1.CommentController],
        providers: [comment_service_1.CommentService, ...comment_provider_1.CommentProvider]
    })
], CommentModule);
//# sourceMappingURL=comment.module.js.map