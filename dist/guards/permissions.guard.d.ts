import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../roles/roles.service';
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private rolesService;
    constructor(reflector: Reflector, rolesService: RolesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
