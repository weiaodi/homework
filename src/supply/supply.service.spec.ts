import { Test, TestingModule } from '@nestjs/testing';
import { SupplyService } from './supply.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';

describe('SupplyService', () => {
  let service: SupplyService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    supply: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    warehouse: {
      findUnique: jest.fn(),
    },
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
    getEntityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyService,
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

    service = module.get<SupplyService>(SupplyService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建供应记录', async () => {
      const createSupplyDto: CreateSupplyDto = {
        quantity: 10,
        supplierId: 1,
        productId: 1,
        warehouseId: 1,
        createtime: new Date(),
      };

      const mockSupplier = { id: 1, name: '供应商1' };
      const mockProduct = { id: 1, name: '产品1' };
      const mockWarehouse = { id: 1, location: '仓库1' };
      const mockSupply = {
        id: 1,
        ...createSupplyDto,
      };

      mockCommonService.getEntityById
        .mockResolvedValueOnce(mockSupplier)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockWarehouse);
      mockPrismaService.supply.create.mockResolvedValue(mockSupply);

      const result = await service.create(createSupplyDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.supply.create).toHaveBeenCalledWith({
        data: {
          quantity: createSupplyDto.quantity,
          supplierId: createSupplyDto.supplierId,
          productId: createSupplyDto.productId,
          warehouseId: createSupplyDto.warehouseId,
          createtime: createSupplyDto.createtime,
        },
      });
      expect(result.tip).toBe('成功创建供应记录');
      expect(result.supply).toEqual(mockSupply);
    });
  });

  describe('findPage', () => {
    it('应该返回分页供应记录列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockSupplies = [
        {
          id: 1,
          quantity: 10,
          supplierId: 1,
          productId: 1,
          warehouseId: 1,
        },
      ];

      const mockSupplier = { id: 1, company: '公司1' };
      const mockProduct = { id: 1, name: '产品1', model: 'M1' };
      const mockWarehouse = { id: 1, location: '仓库1' };

      mockPrismaService.supply.count.mockResolvedValue(1);
      mockPrismaService.supply.findMany.mockResolvedValue(mockSupplies);
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.supply.count).toHaveBeenCalled();
      expect(mockPrismaService.supply.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      expect(result.page).toBe(page);
      expect(result.supplyList).toHaveLength(1);
      expect(result.supplyList[0].supplier).toBe(mockSupplier.company);
      expect(result.supplyList[0].brand).toBe(mockProduct.name);
    });
  });

  describe('findOne', () => {
    it('应该返回供应记录详情', async () => {
      const supplyId = 1;
      const mockSupply = {
        id: supplyId,
        quantity: 10,
        supplierId: 1,
        productId: 1,
        warehouseId: 1,
      };

      const mockSupplier = { id: 1, name: '供应商1' };
      const mockProduct = { id: 1, name: '产品1' };
      const mockWarehouse = { id: 1, location: '仓库1' };

      mockCommonService.getEntityById.mockResolvedValue(mockSupply);
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(supplyId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.supply,
        supplyId,
      );
      expect(result.id).toBe(supplyId);
      expect(result.supplier).toEqual(mockSupplier);
      expect(result.product).toEqual(mockProduct);
      expect(result.warehouse).toEqual(mockWarehouse);
    });
  });

  describe('update', () => {
    it('应该成功更新供应记录', async () => {
      const supplyId = 1;
      const updateSupplyDto: UpdateSupplyDto = {
        quantity: 20,
        supplierId: 2,
        productId: 2,
        warehouseId: 2,
      };

      const mockSupply = { id: supplyId };
      const mockSupplier = { id: 2 };
      const mockProduct = { id: 2 };
      const mockWarehouse = { id: 2 };
      const updatedSupply = { id: supplyId, ...updateSupplyDto };

      mockCommonService.getEntityById
        .mockResolvedValueOnce(mockSupply)
        .mockResolvedValueOnce(mockSupplier)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockWarehouse);
      mockPrismaService.supply.update.mockResolvedValue(updatedSupply);

      const result = await service.update(supplyId, updateSupplyDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.supply.update).toHaveBeenCalledWith({
        where: { id: supplyId },
        data: updateSupplyDto,
      });
      expect(result.tip).toBe('成功修改供应记录');
      expect(result.supply).toEqual(updatedSupply);
    });
  });

  describe('remove', () => {
    it('应该成功删除供应记录', async () => {
      const supplyId = 1;
      const mockSupply = { id: supplyId };

      mockCommonService.getEntityById.mockResolvedValue(mockSupply);
      mockPrismaService.supply.delete.mockResolvedValue(mockSupply);

      const result = await service.remove(supplyId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.supply,
        supplyId,
      );
      expect(mockPrismaService.supply.delete).toHaveBeenCalledWith({
        where: { id: supplyId },
      });
      expect(result.tip).toBe('成功删除供应记录');
    });
  });
});
