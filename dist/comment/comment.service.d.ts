import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create.dto';
import { UpdateCommentDto } from './dto/update.dto';
import { ComplaintsService } from 'complaint/complaint.service';
import { RequestServicesService } from 'requestServices/requestServices.service';
import { TouchPointsService } from 'touchpoint/touch-points.service';
export declare class CommentService {
    private readonly commentRepository;
    private readonly complaintService;
    private readonly suggestionService;
    private readonly touchPointsService;
    constructor(commentRepository: Repository<Comment>, complaintService: ComplaintsService, suggestionService: RequestServicesService, touchPointsService: TouchPointsService);
    create(createCommentDto: CreateCommentDto): Promise<Comment>;
    findAll(page: any, perPage: any, filterOptions: any, state: any): Promise<{
        data: Comment[];
        total: number;
    }>;
    findOne(id: string): Promise<Comment>;
    update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment>;
    remove(id: string): Promise<void>;
}
