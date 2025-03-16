// auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      id: user.id,
      username: user.username,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  // Add the changePassword method
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<any> {
    const user = await this.usersService.findOne(userId);

    // Check if user exists and if the old password is correct
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Check if the new password is the same as the old password
    if (oldPassword === newPassword) {
      throw new UnauthorizedException('New password cannot be the same as old password');
    }

    // Hash and update the password
    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);

    return { message: 'Password updated successfully' };
  }
}
