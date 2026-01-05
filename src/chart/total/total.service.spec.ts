import { Test, TestingModule } from '@nestjs/testing';
import { TotalService } from './total.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';

describe('TotalService', () => {
  let service: TotalService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    order: {
      count: jest.fn(),
    },
    warehouse: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotalService,
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

    service = module.get<TotalService>(TotalService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getIncome', () => {
    it('应该返回总营业额', async () => {
      const mockResult = [{ income: 1000000.5 }];

      mockPrismaService.$queryRaw.mockResolvedValue(mockResult);

      const result = await service.getIncome();

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.total).toBe(mockResult[0].income);
    });
  });

  describe('getSales', () => {
    it('应该返回总成交量', async () => {
      const mockCount = 50;

      mockPrismaService.order.count.mockResolvedValue(mockCount);

      const result = await service.getSales();

      expect(mockPrismaService.order.count).toHaveBeenCalled();
      expect(result.total).toBe(mockCount);
    });
  });

  describe('getWarehouses', () => {
    it('应该返回仓库总数', async () => {
      const mockCount = 5;

      mockPrismaService.warehouse.count.mockResolvedValue(mockCount);

      const result = await service.getWarehouses();

      expect(mockPrismaService.warehouse.count).toHaveBeenCalled();
      expect(result.total).toBe(mockCount);
    });
  });

  describe('getUsers', () => {
    it('应该返回员工总数', async () => {
      const mockCount = 10;

      mockPrismaService.user.count.mockResolvedValue(mockCount);

      const result = await service.getUsers();

      expect(mockPrismaService.user.count).toHaveBeenCalled();
      expect(result.total).toBe(mockCount);
    });
  });
});

