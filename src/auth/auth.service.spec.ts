import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let commonService: CommonService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CommonService,
          useValue: mockCommonService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: '测试用户',
      phone: '13800138001',
      password: '123456',
      passwordConfirmed: '123456',
      role: 'USER' as any,
    };

    it('应该成功注册新用户', async () => {
      // 模拟手机号不存在
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      const mockUser = {
        id: 1,
        username: registerDto.username,
        phone: registerDto.phone,
        password: createHash('sha256').update(registerDto.password).digest('hex'),
        role: registerDto.role,
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: registerDto.phone },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result.tip).toBe('注册成功');
      expect(result.user).toBeDefined();
    });

    it('应该抛出异常当手机号已被注册', async () => {
      // 模拟手机号已存在
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        phone: registerDto.phone,
      });

      await expect(service.register(registerDto)).rejects.toThrow(HttpException);
      try {
        await service.register(registerDto);
      } catch (error) {
        expect(error.getResponse()).toHaveProperty('tip', '该电话号码已被注册');
      }
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      phone: '13800138000',
      password: '123456',
    };

    const mockUser = {
      id: 1,
      username: '测试用户',
      phone: loginDto.phone,
      password: loginDto.password, // 注意：实际代码中密码是明文比较
      role: 'USER' as any,
    };

    it('应该成功登录并返回token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: loginDto.phone },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(result.tip).toBe('登录成功');
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('应该抛出异常当手机号不存在', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);
      try {
        await service.login(loginDto);
      } catch (error) {
        expect(error.getResponse()).toHaveProperty('tip', '手机号不存在');
      }
    });

    it('应该抛出异常当密码不匹配', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'wrong-password',
      });

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);
      try {
        await service.login(loginDto);
      } catch (error) {
        expect(error.getResponse()).toHaveProperty('tip', '手机号与密码不匹配');
      }
    });
  });

  describe('autoLogin', () => {
    it('应该返回用户信息', async () => {
      const mockUser = {
        id: 1,
        username: '测试用户',
        phone: '13800138000',
        role: 'USER' as any,
      };

      const result = await service.autoLogin(mockUser as any);

      expect(result.user).toEqual(mockUser);
    });
  });
});

