import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('认证模块 (Auth)', () => {
    const testPhone = '13900000001';
    const testPassword = 'test123456';

    it('POST /api/auth/register - 应该成功注册用户', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: '测试用户',
          phone: testPhone,
          password: testPassword,
          passwordConfirmed: testPassword,
          role: 'USER',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.tip).toBe('注册成功');
          expect(res.body.data.user).toBeDefined();
        });
    });

    it('POST /api/auth/register - 应该拒绝重复注册', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: '测试用户2',
          phone: testPhone, // 使用已注册的手机号
          password: testPassword,
          passwordConfirmed: testPassword,
          role: 'USER',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.data.tip).toBe('该电话号码已被注册');
        });
    });

    it('POST /api/auth/login - 应该成功登录', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          phone: '13800138000', // 使用seed中的管理员账号
          password: '123456',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.tip).toBe('登录成功');
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.user).toBeDefined();
          authToken = res.body.data.token; // 保存token用于后续测试
        });
    });

    it('POST /api/auth/login - 应该拒绝错误的密码', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          phone: '13800138000',
          password: 'wrong-password',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.data.tip).toBe('手机号与密码不匹配');
        });
    });
  });

  describe('产品模块 (Product)', () => {
    let productId: number;

    it('GET /api/product - 应该返回产品列表', () => {
      return request(app.getHttpServer())
        .get('/api/product')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/product/page?page=1&pageSize=10 - 应该返回分页产品列表', () => {
      return request(app.getHttpServer())
        .get('/api/product/page?page=1&pageSize=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.page).toBe(1);
          expect(res.body.data.source).toBeDefined();
          if (res.body.data.source.length > 0) {
            productId = res.body.data.source[0].id;
          }
        });
    });

    it('GET /api/product/:id - 应该返回产品详情', () => {
      if (!productId) {
        return; // 跳过如果没有产品
      }
      return request(app.getHttpServer())
        .get(`/api/product/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.product).toBeDefined();
          expect(res.body.data.pie).toBeDefined();
          expect(res.body.data.gradientBarX).toBeDefined();
        });
    });
  });

  describe('订单模块 (Order)', () => {
    it('GET /api/order/page?page=1&pageSize=10 - 应该返回分页订单列表', () => {
      return request(app.getHttpServer())
        .get('/api/order/page?page=1&pageSize=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.page).toBe(1);
          expect(res.body.data.orderList).toBeDefined();
        });
    });
  });

  describe('仓库模块 (Warehouse)', () => {
    it('GET /api/warehouse - 应该返回仓库列表', () => {
      return request(app.getHttpServer())
        .get('/api/warehouse')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('数据统计模块 (Chart)', () => {
    it('GET /api/chart/total/income - 应该返回总营业额', () => {
      return request(app.getHttpServer())
        .get('/api/chart/total/income')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.total).toBeDefined();
        });
    });

    it('GET /api/chart/total/sales - 应该返回总成交量', () => {
      return request(app.getHttpServer())
        .get('/api/chart/total/sales')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.total).toBeDefined();
        });
    });

    it('GET /api/chart/ranking/user - 应该返回员工销售榜', () => {
      return request(app.getHttpServer())
        .get('/api/chart/ranking/user')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.xList).toBeDefined();
          expect(res.body.data.yList).toBeDefined();
          expect(res.body.data.source).toBeDefined();
        });
    });

    it('GET /api/chart/ranking/car - 应该返回汽车热销榜', () => {
      return request(app.getHttpServer())
        .get('/api/chart/ranking/car')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.xList).toBeDefined();
          expect(res.body.data.yList).toBeDefined();
          expect(res.body.data.source).toBeDefined();
        });
    });
  });
});
