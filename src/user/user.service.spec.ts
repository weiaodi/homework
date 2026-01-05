import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';
import { createHash } from 'crypto';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
    getEntityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CommonService,
          useValue: mockCommonService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPage', () => {
    it('应该返回分页用户列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockUsers = [
        {
          id: 1,
          username: '用户1',
          phone: '13800138001',
          role: 'USER' as any,
        },
        {
          id: 2,
          username: '用户2',
          phone: '13800138002',
          role: 'ADMIN' as any,
        },
      ];

      mockPrismaService.user.count.mockResolvedValue(2);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.user.count).toHaveBeenCalled();
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          avatar: true,
          username: true,
          phone: true,
          joined_date: true,
          address: true,
          role: true,
        },
      });
      expect(result.page).toBe(page);
      expect(result.pageTotal).toBe(1);
      expect(result.userTotal).toBe(2);
      expect(result.userList).toEqual(mockUsers);
    });
  });

  describe('findAll', () => {
    it('应该返回所有用户', async () => {
      const mockUsers = [
        { id: 1, username: '用户1' },
        { id: 2, username: '用户2' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('应该返回用户详情', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        username: '测试用户',
        phone: '13800138000',
        role: 'USER' as any,
        avatar: 'avatar.jpg',
        joined_date: new Date(),
        address: '测试地址',
      };

      mockCommonService.getEntityById.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.user,
        userId,
      );
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
    });
  });

  describe('findOneByPhone', () => {
    it('应该返回true当用户存在', async () => {
      const phone = '13800138000';
      const mockUser = { id: 1, phone };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneByPhone(phone);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone },
      });
      expect(result).toBe(true);
    });

    it('应该返回false当用户不存在', async () => {
      const phone = '13800138000';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOneByPhone(phone);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('应该成功更新用户信息', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        username: '更新后的用户名',
        phone: '13900000001',
        role: 'ADMIN' as any,
        address: '更新后的地址',
        joined_date: new Date(),
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        ...updateUserDto,
      });

      const result = await service.update(userId, updateUserDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.user,
        userId,
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          phone: updateUserDto.phone,
          username: updateUserDto.username,
          role: updateUserDto.role,
          address: updateUserDto.address,
          joined_date: updateUserDto.joined_date,
        },
      });
      expect(result.tip).toBe('成功修改用户信息');
    });
  });

  describe('updateAvatar', () => {
    it('应该成功更新用户头像', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        avatar: 'https://example.com/new-avatar.jpg',
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        avatar: updateUserDto.avatar,
      });

      const result = await service.updateAvatar(userId, updateUserDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.user,
        userId,
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          avatar: updateUserDto.avatar,
        },
      });
      expect(result.tip).toBe('成功修改用户头像');
    });
  });

  describe('updatePassword', () => {
    it('应该成功修改密码', async () => {
      const userId = 1;
      const originalPassword = 'old123456';
      const newPassword = 'new123456';
      const updatePasswordDto: UpdatePasswordDto = {
        originalPassword,
        password: newPassword,
        passwordConfirmed: newPassword,
      };

      const hashedOriginalPassword = createHash('sha256')
        .update(originalPassword)
        .digest('hex');
      const mockUser = {
        id: userId,
        password: hashedOriginalPassword,
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        password: createHash('sha256').update(newPassword).digest('hex'),
      });

      const result = await service.updatePassword(userId, updatePasswordDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.user,
        userId,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result.success).toBe(true);
      expect(result.tip).toBe('成功修改密码');
    });

    it('应该返回错误当新密码与确认密码不一致', async () => {
      const userId = 1;
      const updatePasswordDto: UpdatePasswordDto = {
        originalPassword: 'old123456',
        password: 'new123456',
        passwordConfirmed: 'different123456',
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });

      const result = await service.updatePassword(userId, updatePasswordDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('新密码与确认密码必须保持一致');
    });

    it('应该返回错误当原密码错误', async () => {
      const userId = 1;
      const updatePasswordDto: UpdatePasswordDto = {
        originalPassword: 'wrong-password',
        password: 'new123456',
        passwordConfirmed: 'new123456',
      };

      const hashedPassword = createHash('sha256')
        .update('correct-password')
        .digest('hex');
      const mockUser = {
        id: userId,
        password: hashedPassword,
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.updatePassword(userId, updatePasswordDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('原密码错误');
    });
  });

  describe('remove', () => {
    it('应该成功删除用户及其关联数据', async () => {
      const userId = 1;

      mockCommonService.getEntityById.mockResolvedValue({ id: userId });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          order: {
            deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          user: {
            delete: jest.fn().mockResolvedValue({ id: userId }),
          },
        });
      });

      const result = await service.remove(userId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.user,
        userId,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tip).toBe('成功删除用户');
    });
  });
});

