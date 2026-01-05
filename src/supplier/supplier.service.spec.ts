import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from './supplier.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaModel } from 'src/common/enum/PrismaModel';

describe('SupplierService', () => {
  let service: SupplierService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    supplier: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    supply: {
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
        SupplierService,
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

    service = module.get<SupplierService>(SupplierService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建供应商', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: '测试供应商',
        phone: '13900000001',
        company: '测试公司',
      };

      const mockSupplier = {
        id: 1,
        ...createSupplierDto,
      };

      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);

      const result = await service.create(createSupplierDto);

      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: {
          name: createSupplierDto.name,
          phone: createSupplierDto.phone,
          company: createSupplierDto.company,
        },
      });
      expect(result.tip).toBe('成功创建供应商');
      expect(result.supplier).toEqual(mockSupplier);
    });
  });

  describe('findPage', () => {
    it('应该返回分页供应商列表', async () => {
      const page = 1;
      const pageSize = 10;
      const mockSuppliers = [
        { id: 1, name: '供应商1', phone: '13900000001', company: '公司1' },
        { id: 2, name: '供应商2', phone: '13900000002', company: '公司2' },
      ];

      mockPrismaService.supplier.count.mockResolvedValue(2);
      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      const result = await service.findPage(page, pageSize);

      expect(mockPrismaService.supplier.count).toHaveBeenCalled();
      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      expect(result.page).toBe(page);
      expect(result.pageTotal).toBe(1);
      expect(result.supplierTotal).toBe(2);
      expect(result.supplierList).toEqual(mockSuppliers);
    });
  });

  describe('findAll', () => {
    it('应该返回所有供应商', async () => {
      const mockSuppliers = [
        { id: 1, name: '供应商1' },
        { id: 2, name: '供应商2' },
      ];

      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);

      const result = await service.findAll();

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockSuppliers);
    });
  });

  describe('findOne', () => {
    it('应该返回供应商详情', async () => {
      const supplierId = 1;
      const mockSupplier = {
        id: supplierId,
        name: '测试供应商',
        phone: '13900000001',
        company: '测试公司',
      };

      mockCommonService.getEntityById.mockResolvedValue(mockSupplier);

      const result = await service.findOne(supplierId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.supplier,
        supplierId,
      );
      expect(result.supplier).toEqual(mockSupplier);
    });
  });

  describe('update', () => {
    it('应该成功更新供应商信息', async () => {
      const supplierId = 1;
      const updateSupplierDto: UpdateSupplierDto = {
        name: '更新后的供应商',
        phone: '13900000002',
        company: '更新后的公司',
      };

      const mockSupplier = {
        id: supplierId,
        ...updateSupplierDto,
      };

      mockCommonService.getEntityById.mockResolvedValue({ id: supplierId });
      mockPrismaService.supplier.update.mockResolvedValue(mockSupplier);

      const result = await service.update(supplierId, updateSupplierDto);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.supplier,
        supplierId,
      );
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: supplierId },
        data: {
          name: updateSupplierDto.name,
          phone: updateSupplierDto.phone,
          company: updateSupplierDto.company,
        },
      });
      expect(result.tip).toBe('成功修改供应商信息');
      expect(result.supplier).toEqual(mockSupplier);
    });
  });

  describe('remove', () => {
    it('应该成功删除供应商及其关联数据', async () => {
      const supplierId = 1;

      mockCommonService.getEntityById.mockResolvedValue({ id: supplierId });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          supply: {
            deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          supplier: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const result = await service.remove(supplierId);

      expect(mockCommonService.getEntityById).toHaveBeenCalledWith(
        PrismaModel.supplier,
        supplierId,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.tip).toBe('成功删除供应商');
    });
  });
});
