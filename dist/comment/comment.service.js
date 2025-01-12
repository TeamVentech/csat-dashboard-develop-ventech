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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let CommentService = class CommentService {
    constructor(commentRepository) {
        this.commentRepository = commentRepository;
    }
    async create(createCommentDto) {
        const department = this.commentRepository.create(createCommentDto);
        return this.commentRepository.save(department);
    }
    async findAll(page, perPage, filterOptions) {
        page = page || 1;
        perPage = perPage || 10;
        const queryBuilder = this.commentRepository.createQueryBuilder('comments')
            .leftJoinAndSelect('comments.category', 'category')
            .leftJoinAndSelect('comments.survey', 'survey')
            .leftJoinAndSelect('comments.customer', 'customer');
        if (filterOptions) {
            if (filterOptions.search) {
                const searchString = await filterOptions.search.startsWith(' ')
                    ? filterOptions.search.replace(' ', '+')
                    : filterOptions.search;
                filterOptions.search = searchString;
                queryBuilder.andWhere('(customer.name ILIKE :search)', {
                    search: `%${filterOptions.search}%`,
                });
            }
            Object.keys(filterOptions).forEach(key => {
                if (key !== 'search' && filterOptions[key]) {
                    queryBuilder.andWhere(`comments.${key} = :${key}`, { [key]: filterOptions[key] });
                }
            });
        }
        const [data, total] = await queryBuilder
            .skip((page - 1) * perPage)
            .take(perPage)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const Comment = await this.commentRepository.findOne({ where: { id: id } });
        if (!Comment) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return Comment;
    }
    async update(id, updateCommentDto) {
        await this.findOne(id);
        await this.commentRepository.update(id, updateCommentDto);
        return this.findOne(id);
    }
    async remove(id) {
        const Comment = await this.findOne(id);
        await this.commentRepository.remove(Comment);
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('COMMENT_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], CommentService);
//# sourceMappingURL=comment.service.js.map