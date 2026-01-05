import { Test, TestingModule } from '@nestjs/testing';
import { RankingCarService } from './ranking.car.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';

describe('RankingCarService', () => {
  let service: RankingCarService;
  let prismaService: PrismaService;
  let commonService: CommonService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockCommonService = {
    handlePrismaExecution: jest.fn((callback) => callback()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingCarService,
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

    service = module.get<RankingCarService>(RankingCarService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCarRanking', () => {
    it('应该返回汽车热销排行榜', async () => {
      const currentYear = new Date().getFullYear();
      const mockProducts = [
        { id: 1, fullname: '汽车1-M1' },
        { id: 2, fullname: '汽车2-M2' },
      ];

      const mockSalesData = [
        {
          productId: 1,
          product: '汽车1-M1',
          currentyear: BigInt(currentYear - 9),
          sales: '5',
        },
        {
          productId: 1,
          product: '汽车1-M1',
          currentyear: BigInt(currentYear - 8),
          sales: '8',
        },
      ];

      // 第一次查询：获取前7名产品
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockProducts)
        // 第二次查询：获取年度销量数据
        .mockResolvedValueOnce(mockSalesData);

      const result = await service.getCarRanking();

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.idList).toBeDefined();
      expect(result.xList).toBeDefined();
      expect(result.yList).toBeDefined();
      expect(result.source).toBeDefined();
      expect(Array.isArray(result.idList)).toBe(true);
      expect(Array.isArray(result.xList)).toBe(true);
      expect(Array.isArray(result.yList)).toBe(true);
      expect(Array.isArray(result.source)).toBe(true);
    });
  });
});

