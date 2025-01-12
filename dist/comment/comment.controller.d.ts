import { CommentService } from './comment.service';
import { UpdateCommentDto } from './dto/update.dto';
export declare class CommentController {
    private readonly requestServicesService;
    constructor(requestServicesService: CommentService);
    create(createCommentDto: any): Promise<import("./entities/comment.entity").Comment>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/comment.entity").Comment[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/comment.entity").Comment>;
    update(id: string, updateCommentDto: UpdateCommentDto): Promise<import("./entities/comment.entity").Comment>;
    remove(id: string): Promise<void>;
}
