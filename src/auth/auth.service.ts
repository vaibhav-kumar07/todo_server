import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Team, TeamDocument } from '../teams/schemas/team.schema';
import { LoginDto } from './dto/login.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { EmailService } from './email.service';
import { SeedService } from './seed.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private seedService: SeedService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Please verify your email before logging in');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        teamId: user.teamId,
      },
    };
  }

  async inviteUser(inviteUserDto: InviteUserDto, currentUser: any) {
    // Check if user can invite based on role
    if (currentUser.role === UserRole.MEMBER) {
      throw new ForbiddenException('Members cannot invite users');
    }

    if (currentUser.role === UserRole.MANAGER && inviteUserDto.role === UserRole.MANAGER) {
      throw new ForbiddenException('Managers can only invite members');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: inviteUserDto.email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate secure password
    const password = await this.seedService.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create or get team
    let teamId = currentUser.teamId;
    if (inviteUserDto.teamName) {
      const newTeam = new this.teamModel({
        name: inviteUserDto.teamName,
        description: inviteUserDto.teamDescription || '',
        createdBy: currentUser.id,
        isActive: true,
      });
      const savedTeam = await newTeam.save();
      teamId = savedTeam._id;
    }

    // Create user
    const newUser = new this.userModel({
      email: inviteUserDto.email,
      firstName: inviteUserDto.firstName,
      lastName: inviteUserDto.lastName,
      password: hashedPassword,
      role: inviteUserDto.role,
      teamId,
      isEmailVerified: true, // Since admin/manager is creating
      isActive: true,
      invitedBy: currentUser.id,
      invitedAt: new Date(),
    });

    await newUser.save();

    // Send invitation email
    await this.emailService.sendUserInvitation(
      inviteUserDto.email,
      inviteUserDto.firstName,
      inviteUserDto.lastName,
      password,
      inviteUserDto.role,
      `${currentUser.firstName} ${currentUser.lastName}`,
    );

    return {
      message: 'User invited successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        teamId: newUser.teamId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user._id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      teamId: user.teamId,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
} 