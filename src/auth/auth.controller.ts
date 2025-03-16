import { Controller, Post, Body, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from 'users/dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }


  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;
    console.log(changePasswordDto)
    if(confirmPassword !== newPassword){
        throw new HttpException("the password and confirm password  not matched.", HttpStatus.CONFLICT);
    }
    const userId = req.user.id;
    return this.authService.changePassword(userId, oldPassword, newPassword);
  }

}
