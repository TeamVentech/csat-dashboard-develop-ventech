import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersService;
    constructor(usersService: UsersService, configService: ConfigService);
    validate(payload: {
        id: string;
    }): Promise<import("../users/entities/user.entity").User>;
}
export {};
