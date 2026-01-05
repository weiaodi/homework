import { Test, TestingModule } from '@nestjs/testing';
import { RankingUserService } from './ranking.user.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CommonService } from 'src/common/common.service';

describe('RankingUserService', () => {
  let service: RankingUserService;
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
        RankingUserService,
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

    service = module.get<RankingUserService>(RankingUserService);
    prismaService = module.get<PrismaService>(PrismaService);
    commonService = module.get<CommonService>(CommonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRanking', () => {
    it('应该返回员工销售排行榜', async () => {
      const currentYear = new Date().getFullYear();
      const mockTopUsers = [
        { userId: 1, username: '用户1' },
        { userId: 2, username: '用户2' },
      ];

      const mockYearlySales = [
        { currentyear: BigInt(currentYear - 4), total: 10000 },
        { currentyear: BigInt(currentYear - 3), total: 15000 },
      ];

      // 第一次查询：获取前7名员工
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockTopUsers)
        // 后续查询：每个员工的年度销售额（需要为每个用户返回一次）
        .mockResolvedValueOnce(mockYearlySales)
        .mockResolvedValueOnce(mockYearlySales);

      const result = await service.getUserRanking();

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.idList).toBeDefined();
      expect(result.xList).toBeDefined();
      expect(result.yList).toBeDefined();
      expect(result.source).toBeDefined();
      expect(Array.isArray(result.xList)).toBe(true);
      expect(Array.isArray(result.yList)).toBe(true);
      expect(Array.isArray(result.source)).toBe(true);
    });
  });
});

