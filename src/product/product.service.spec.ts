import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';

describe('ProductService', () => {
  let service: ProductService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    inventory: {
      deleteMany: jest.fn(),
    },
    supply: {
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
    getEntityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
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

    service = module.get<ProductService>(ProductService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: '测试汽车',
      model: 'TEST-2024',
      price: 100000,
      introduce: '这是一辆测试汽车',
      poster: 'https://example.com/poster.jpg',
    };

    it('应该成功创建产品', async () => {
      const mockProduct = {
        id: 1,
        ...createProductDto,
        price: +createProductDto.price,
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          name: createProductDto.name,
          model: createProductDto.model,
          price: +createProductDto.price,
          introduce: createProductDto.introduce,
          poster: createProductDto.poster,
        },
      });
      expect(result.tip).toBe('成功创建产品');
      expect(result.product).toEqual(mockProduct);
    });
  });

  describe('findPage', () => {
    it('应该返回分页产品列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockProducts = [
        { id: 1, name: '产品1', model: 'M1', price: 100000 },
        { id: 2, name: '产品2', model: 'M2', price: 200000 },
      ];

      mockPrismaService.product.count.mockResolvedValue(2);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.order.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.product.count).toHaveBeenCalled();
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      expect(result.page).toBe(page);
      expect(result.pageTotal).toBe(1);
      expect(result.productTotal).toBe(2);
      expect(result.source).toHaveLength(2);
      expect(result.source[0].sales).toBe(5);
    });
  });

  describe('findAll', () => {
    it('应该返回所有产品', async () => {
      const mockProducts = [
        { id: 1, name: '产品1' },
        { id: 2, name: '产品2' },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('findOne', () => {
    it('应该返回产品详情和统计数据', async () => {
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: '测试产品',
        model: 'TEST',
        price: 100000,
      };

      const mockPie = [{ value: '10', name: '仓库1' }];
      const mockGradientBar = [
        { year: '2023', total: '5' },
        { year: '2024', total: '8' },
      ];

      mockCommonService.getEntityById.mockResolvedValue(mockProduct);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockPie)
        .mockResolvedValueOnce(mockGradientBar);

      const result = await service.findOne(productId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.product,
        productId,
      );
      expect(result.product).toEqual(mockProduct);
      expect(result.pie).toEqual(mockPie);
      expect(result.gradientBarX).toEqual(['2023', '2024']);
      expect(result.gradientBarY).toEqual([5, 8]);
    });
  });

  describe('update', () => {
    it('应该成功更新产品信息', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: '更新后的产品',
        model: 'UPDATED',
        price: 150000,
        introduce: '更新后的介绍',
      };

      const mockProduct = {
        id: productId,
        ...updateProductDto,
        price: +updateProductDto.price,
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: productId });
      mockPrismaService.product.update.mockResolvedValue(mockProduct);

      const result = await service.update(productId, updateProductDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.product,
        productId,
      );
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: updateProductDto.name,
          model: updateProductDto.model,
          price: +updateProductDto.price,
          introduce: updateProductDto.introduce,
        },
      });
      expect(result.tip).toBe('成功修改产品信息');
      expect(result.product).toEqual(mockProduct);
    });
  });

  describe('remove', () => {
    it('应该成功删除产品及其关联数据', async () => {
      const productId = 1;

      mockCommonService.getEntityById.mockResolvedValue({ id: productId });

      // 设置 transaction 中的 mock 方法
      const mockOrderDeleteMany = jest.fn().mockResolvedValue({ count: 5 });
      const mockSupplyDeleteMany = jest.fn().mockResolvedValue({ count: 3 });
      const mockInventoryDeleteMany = jest.fn().mockResolvedValue({ count: 2 });
      const mockProductDelete = jest.fn().mockResolvedValue({ id: productId });

      // 在 transaction 中，代码使用 this.prisma，所以我们需要 mock 整个 prisma 对象
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        // 临时替换 prisma 方法
        (mockPrismaService.order as any).deleteMany = mockOrderDeleteMany;
        (mockPrismaService.supply as any).deleteMany = mockSupplyDeleteMany;
        (mockPrismaService.inventory as any).deleteMany =
          mockInventoryDeleteMany;
        (mockPrismaService.product as any).delete = mockProductDelete;

        try {
          const result = await callback(mockPrismaService);
          return {
            orderCount: { count: 5 },
            supplyCount: { count: 3 },
            inventoryCount: { count: 2 },
          };
        } finally {
          // 恢复原始方法（如果需要）
        }
      });

      const result = await service.remove(productId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.product,
        productId,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tip).toBe('成功删除产品');
    });
  });
});
