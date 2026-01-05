import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';

describe('OrderService', () => {
  let service: OrderService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    warehouse: {
      findUnique: jest.fn(),
    },
    inventory: {
      updateMany: jest.fn(),
    },
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
    getEntityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
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

    service = module.get<OrderService>(OrderService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      productId: 1,
      userId: 1,
      warehouseId: 1,
      createtime: new Date(),
    };

    it('应该成功创建订单', async () => {
      const mockProduct = { id: 1, name: '测试产品' };
      const mockUser = { id: 1, username: '测试用户' };
      const mockWarehouse = { id: 1, location: '测试仓库' };
      const mockOrder = {
        id: 1,
        ...createOrderDto,
      };

      mockCommonService.getEntityById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockWarehouse);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: {
          productId: createOrderDto.productId,
          userId: createOrderDto.userId,
          warehouseId: createOrderDto.warehouseId,
          createtime: createOrderDto.createtime,
        },
      });
      expect(result.tip).toBe('成功创建订单');
      expect(result.order).toEqual(mockOrder);
    });
  });

  describe('findPage', () => {
    it('应该返回分页订单列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockOrders = [
        {
          id: 1,
          productId: 1,
          userId: 1,
          warehouseId: 1,
          createtime: new Date(),
        },
      ];

      const mockProduct = { id: 1, name: '产品1', model: 'M1' };
      const mockUser = { id: 1, username: '用户1', phone: '13800138000' };
      const mockWarehouse = { id: 1, location: '仓库1' };

      mockPrismaService.order.count.mockResolvedValue(1);
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.order.count).toHaveBeenCalled();
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      expect(result.page).toBe(page);
      expect(result.orderList).toHaveLength(1);
      expect(result.orderList[0].brand).toBe(mockProduct.name);
      expect(result.orderList[0].user).toBe(mockUser.username);
    });
  });

  describe('findOne', () => {
    it('应该返回订单详情', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        productId: 1,
        userId: 1,
        warehouseId: 1,
      };

      const mockProduct = { id: 1, name: '产品1' };
      const mockUser = { id: 1, username: '用户1' };
      const mockWarehouse = { id: 1, location: '仓库1' };

      mockCommonService.getEntityById.mockResolvedValue(mockOrder);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.supplier = {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      };
      mockPrismaService.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(orderId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.order,
        orderId,
      );
      expect(result.id).toBe(orderId);
      expect(result.product).toEqual(mockProduct);
      expect(result.warehouse).toEqual(mockWarehouse);
    });
  });

  describe('update', () => {
    it('应该成功更新订单', async () => {
      const orderId = 1;
      const updateOrderDto: UpdateOrderDto = {
        productId: 2,
        userId: 2,
        warehouseId: 2,
      };

      const mockOrder = { id: orderId };
      const mockProduct = { id: 2 };
      const mockUser = { id: 2 };
      const mockWarehouse = { id: 2 };
      const updatedOrder = { id: orderId, ...updateOrderDto };

      mockCommonService.getEntityById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockWarehouse);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.update(orderId, updateOrderDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: updateOrderDto,
      });
      expect(result.tip).toBe('成功修改订单');
      expect(result.order).toEqual(updatedOrder);
    });
  });

  describe('remove', () => {
    it('应该成功删除订单并恢复库存', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        productId: 1,
        warehouseId: 1,
      };

      mockCommonService.getEntityById.mockResolvedValue(mockOrder);
      mockPrismaService.order.delete.mockResolvedValue(mockOrder);
      mockPrismaService.inventory.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(orderId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.order,
        orderId,
      );
      expect(mockPrismaService.order.delete).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockPrismaService.inventory.updateMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              productId: mockOrder.productId,
              warehouseId: mockOrder.warehouseId,
            },
          ],
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });
      expect(result.tip).toBe('成功删除订单');
    });
  });
});
