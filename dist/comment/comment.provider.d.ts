import { DataSource } from 'typeorm';
import { Comment } from './entities/comment.entity';
export declare const CommentProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Comment>;
    inject: string[];
}[];
