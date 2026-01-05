import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from './warehouse.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    warehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    supply: {
      deleteMany: jest.fn(),
    },
    order: {
      deleteMany: jest.fn(),
    },
    inventory: {
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
        WarehouseService,
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

    service = module.get<WarehouseService>(WarehouseService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建仓库', async () => {
      const createWarehouseDto: CreateWarehouseDto = {
        location: '测试仓库位置',
      };

      const mockWarehouse = {
        id: 1,
        location: createWarehouseDto.location,
      };

      mockPrismaService.warehouse.create.mockResolvedValue(mockWarehouse);

      const result = await service.create(createWarehouseDto);

      expect(mockPrismaService.warehouse.create).toHaveBeenCalledWith({
        data: {
          location: createWarehouseDto.location,
        },
      });
      expect(result.tip).toBe('成功创建仓库');
      expect(result.warehouse).toEqual(mockWarehouse);
    });
  });

  describe('findPage', () => {
    it('应该返回分页仓库列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockWarehouses = [
        { id: 1, location: '仓库1' },
        { id: 2, location: '仓库2' },
      ];

      mockPrismaService.warehouse.count.mockResolvedValue(2);
      mockPrismaService.warehouse.findMany.mockResolvedValue(mockWarehouses);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.warehouse.count).toHaveBeenCalled();
      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      expect(result.page).toBe(page);
      expect(result.pageTotal).toBe(1);
      expect(result.warehouseTotal).toBe(2);
      expect(result.warehouseList).toEqual(mockWarehouses);
    });
  });

  describe('findAll', () => {
    it('应该返回所有仓库', async () => {
      const mockWarehouses = [
        { id: 1, location: '仓库1' },
        { id: 2, location: '仓库2' },
      ];

      mockPrismaService.warehouse.findMany.mockResolvedValue(mockWarehouses);

      const result = await service.findAll();

      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockWarehouses);
    });
  });

  describe('findOne', () => {
    it('应该返回仓库详情', async () => {
      const warehouseId = 1;
      const mockWarehouse = {
        id: warehouseId,
        location: '测试仓库',
      };

      mockCommonService.getEntityById.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(warehouseId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.warehouse,
        warehouseId,
      );
      expect(result.warehouse).toEqual(mockWarehouse);
    });
  });

  describe('findInventory', () => {
    it('应该返回仓库库存列表', async () => {
      const warehouseId = 1;
      const mockInventory = [
        { id: 1, name: '产品1', model: 'M1' },
        { id: 2, name: '产品2', model: 'M2' },
      ];

      mockCommonService.getEntityById.mockResolvedValue({ id: warehouseId });
      mockPrismaService.$queryRaw.mockResolvedValue(mockInventory);

      const result = await service.findInventory(warehouseId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.warehouse,
        warehouseId,
      );
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockInventory);
    });
  });

  describe('update', () => {
    it('应该成功更新仓库信息', async () => {
      const warehouseId = 1;
      const updateWarehouseDto: UpdateWarehouseDto = {
        location: '更新后的仓库位置',
      };

      const mockWarehouse = {
        id: warehouseId,
        ...updateWarehouseDto,
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: warehouseId });
      mockPrismaService.warehouse.update.mockResolvedValue(mockWarehouse);

      const result = await service.update(warehouseId, updateWarehouseDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.warehouse,
        warehouseId,
      );
      expect(mockPrismaService.warehouse.update).toHaveBeenCalledWith({
        where: { id: warehouseId },
        data: {
          location: updateWarehouseDto.location,
        },
      });
      expect(result.tip).toBe('成功修改仓库信息');
      expect(result.warehouse).toEqual(mockWarehouse);
    });
  });

  describe('remove', () => {
    it('应该成功删除仓库及其关联数据', async () => {
      const warehouseId = 1;

      mockCommonService.getEntityById.mockResolvedValue({ id: warehouseId });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          supply: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
          order: {
            deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          inventory: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          warehouse: {
            delete: jest.fn().mockResolvedValue({ id: warehouseId }),
          },
        });
      });

      const result = await service.remove(warehouseId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.warehouse,
        warehouseId,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tip).toBe('成功删除仓库');
    });
  });
});
