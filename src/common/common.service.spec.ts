import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CommonService } from './common.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModel } from './enum/PrismaModel';

describe('CommonService', () => {
  let service: CommonService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommonService>(CommonService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntityById', () => {
    it('应该成功返回实体', async () => {
      const entityId = 1;
      const mockEntity = { id: entityId, name: '测试实体' };

      mockPrismaService.product.findUnique.mockResolvedValue(mockEntity);

      const result = await service.getEntityById(PrismaModel.product, entityId);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
      });
      expect(result).toEqual(mockEntity);
    });

    it('应该抛出异常当实体不存在', async () => {
      const entityId = 999;

      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.getEntityById(PrismaModel.product, entityId),
      ).rejects.toThrow(HttpException);
      try {
        await service.getEntityById(PrismaModel.product, entityId);
      } catch (error) {
        expect(error.getResponse()).toHaveProperty('tip', '请提供有效的 id');
      }
    });

    it('应该抛出异常当查询出错', async () => {
      const entityId = 1;

      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('数据库错误'),
      );

      await expect(
        service.getEntityById(PrismaModel.product, entityId),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('handlePrismaExecution', () => {
    it('应该成功执行回调函数', async () => {
      const mockData = { id: 1, name: '测试' };
      const callback = jest.fn().mockResolvedValue(mockData);

      const result = await service.handlePrismaExecution(callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('应该捕获并抛出Prisma错误', async () => {
      const error = new Error('Prisma错误');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(service.handlePrismaExecution(callback)).rejects.toThrow(
        HttpException,
      );
      try {
        await service.handlePrismaExecution(callback);
      } catch (e) {
        expect(e.getResponse()).toHaveProperty('tip', 'PRISMA 发生错误');
      }
    });
  });
});
