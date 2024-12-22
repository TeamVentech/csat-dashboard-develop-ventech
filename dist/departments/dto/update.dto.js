"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDepartmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_dto_1 = require("./create.dto");
class UpdateDepartmentDto extends (0, mapped_types_1.PartialType)(create_dto_1.CreateDepartmentDto) {
}
exports.UpdateDepartmentDto = UpdateDepartmentDto;
//# sourceMappingURL=update.dto.js.map