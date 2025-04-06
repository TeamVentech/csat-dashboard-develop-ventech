import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { RolesService } from '../roles/roles.service';
  import { difference } from 'lodash';
  
  @Injectable()
  export class PermissionsGuard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
      private rolesService: RolesService,
    ) {}
  
    async canActivate(context: ExecutionContext) {
      const routePermissions = this.reflector.get<string[]>(
        'permissions',
        context.getHandler(),
      );
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const role = await this.rolesService.findOne(user.role);
      
      // // Check if the role version in the token matches the current role version
      // if (user.roleVersion !== role.version) {
      //   throw new UnauthorizedException('Your permissions have been updated. Please login again.');
      // }
      
      const userPermissions = role.ability.map(
        (ability) => `${ability.subject}::${ability.action}`,
      );

      if (!routePermissions) {
        return true;
      }
  
      const hasPermission = () =>
        !difference(routePermissions, userPermissions).length;
  
      if (hasPermission()) {
        return true;
      } else {
        throw new ForbiddenException();
      }
    }
  }