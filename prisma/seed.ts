import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 辅助函数：生成指定范围内的随机日期
function getRandomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function main() {
  // 1. 创建测试用户（大连交通大学管理员）
  const adminUser = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      username: '大连交大管理员',
      password: '123456', // 实际项目请加密
      phone: '13800138000',
      role: 'ADMIN',
      address: '辽宁省大连市沙河口区黄河路794号大连交通大学',
      avatar:
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    },
  });
  console.log('创建管理员用户:', adminUser);

  // 新增：创建普通用户（模拟下单员工）
  const normalUsers = await prisma.user.createMany({
    data: [
      {
        username: '大连交大后勤采购员',
        password: '123456',
        phone: '13500135000',
        role: 'USER',
        address: '辽宁省大连市沙河口区黄河路794号大连交通大学后勤处',
      },
      {
        username: '大连交大汽车学院教员',
        password: '123456',
        phone: '13400134000',
        role: 'USER',
        address: '辽宁省大连市沙河口区黄河路794号大连交通大学汽车工程学院',
      },
      {
        username: '大连交大科研助理',
        password: '123456',
        phone: '13200132000',
        role: 'USER',
        address: '辽宁省大连市沙河口区黄河路794号大连交通大学科研处',
      },
    ],
    skipDuplicates: true,
  });
  console.log('创建普通用户:', normalUsers);
  const userList = await prisma.user.findMany(); // 获取所有用户

  // 2. 创建大连交通大学相关仓库
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      location: '大连交通大学黄河路校区后勤仓库',
    },
  });
  // 新增：第二个仓库（模拟旅顺校区）
  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      location: '大连交通大学旅顺校区物流仓库',
    },
  });
  console.log('创建仓库:', warehouse, warehouse2);

  // 3. 创建大连交通大学相关供应商
  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        name: '大连交通大学汽车工程学院供应商',
        phone: '13900139000',
        company: '大连交通大学产学研合作中心',
      },
      {
        name: '大连交大后勤车辆供应部',
        phone: '13700137000',
        company: '大连交通大学后勤保障处',
      },
      {
        name: '大连交大新能源汽车研发中心',
        phone: '13600136000',
        company: '大连交通大学新能源汽车研究所',
      },
    ],
    skipDuplicates: true, // 避免重复创建
  });
  console.log('创建供应商:', suppliers);

  // 获取创建的供应商列表
  const supplierList = await prisma.supplier.findMany();

  // 4. 创建大连交通大学相关汽车产品
  const products = await prisma.product.createMany({
    data: [
      {
        name: '大连交大通勤大巴',
        model: '宇通ZK6122HQ',
        price: 850000.0,
        introduce:
          '大连交通大学校内通勤专用大巴，用于校区间师生接送，配备空调、舒适座椅，符合高校通勤安全标准。',
        poster: 'http://cdn.tako.top/CarSale%20Poster.png',
      },
      {
        name: '大连交大教学用新能源轿车',
        model: '比亚迪秦PLUS DM-i',
        price: 159800.0,
        introduce:
          '大连交通大学汽车工程学院教学专用车辆，用于新能源汽车原理教学、学生实操训练。',
        poster: 'http://cdn.tako.top/CarSale%20Poster.png',
      },
      {
        name: '大连交大科研用皮卡',
        model: '长城炮 2.0T 四驱版',
        price: 126800.0,
        introduce:
          '大连交通大学道路工程研究所科研专用车辆，用于野外路况检测、数据采集。',
        poster: 'http://cdn.tako.top/CarSale%20Poster.png',
      },
      {
        name: '大连交大后勤服务车',
        model: '五菱宏光PLUS',
        price: 69800.0,
        introduce:
          '大连交通大学后勤保障处专用服务车，用于校园物资运输、设备维修。',
        poster: 'http://cdn.tako.top/CarSale%20Poster.png',
      },
    ],
    skipDuplicates: true,
  });
  console.log('创建产品:', products);

  // 获取创建的产品列表
  const productList = await prisma.product.findMany();

  // 5. 创建供应关系（供应商-产品-仓库关联）
  const supplies = await prisma.supply.createMany({
    data: [
      {
        quantity: 10, // 供应数量
        supplierId: supplierList[0].id, // 汽车工程学院供应商
        productId: productList[1].id, // 教学用新能源轿车
        warehouseId: warehouse.id,
        createtime: new Date(),
      },
      {
        quantity: 5,
        supplierId: supplierList[1].id, // 后勤车辆供应部
        productId: productList[0].id, // 通勤大巴
        warehouseId: warehouse.id,
        createtime: new Date(),
      },
      {
        quantity: 3,
        supplierId: supplierList[2].id, // 新能源汽车研发中心
        productId: productList[2].id, // 科研用皮卡
        warehouseId: warehouse.id,
        createtime: new Date(),
      },
      {
        quantity: 20,
        supplierId: supplierList[1].id, // 后勤车辆供应部
        productId: productList[3].id, // 后勤服务车
        warehouseId: warehouse.id,
        createtime: new Date(),
      },
      // 新增：旅顺校区供应数据
      {
        quantity: 8,
        supplierId: supplierList[0].id,
        productId: productList[1].id,
        warehouseId: warehouse2.id,
        createtime: getRandomDate(
          new Date('2024-01-01'),
          new Date('2024-12-31'),
        ),
      },
      {
        quantity: 15,
        supplierId: supplierList[1].id,
        productId: productList[3].id,
        warehouseId: warehouse2.id,
        createtime: getRandomDate(
          new Date('2024-01-01'),
          new Date('2024-12-31'),
        ),
      },
    ],
    skipDuplicates: true,
  });
  console.log('创建供应关系:', supplies);

  // 6. 创建库存数据
  const inventories = await prisma.inventory.createMany({
    data: [
      {
        productId: productList[0].id, // 通勤大巴
        warehouseId: warehouse.id,
        quantity: 8, // 库存数量
      },
      {
        productId: productList[1].id, // 教学用新能源轿车
        warehouseId: warehouse.id,
        quantity: 15,
      },
      {
        productId: productList[2].id, // 科研用皮卡
        warehouseId: warehouse.id,
        quantity: 4,
      },
      {
        productId: productList[3].id, // 后勤服务车
        warehouseId: warehouse.id,
        quantity: 25,
      },
      // 新增：旅顺校区库存
      {
        productId: productList[0].id,
        warehouseId: warehouse2.id,
        quantity: 3,
      },
      {
        productId: productList[1].id,
        warehouseId: warehouse2.id,
        quantity: 8,
      },
      {
        productId: productList[3].id,
        warehouseId: warehouse2.id,
        quantity: 18,
      },
    ],
    skipDuplicates: true,
  });
  console.log('创建库存:', inventories);

  // 7. 批量创建销量订单数据（核心新增部分）
  // 定义不同产品的销量订单配置（产品ID => 订单数量 + 下单用户）
  const salesOrderConfig = [
    // 通勤大巴（高单价，低销量）
    {
      productId: productList[0].id,
      count: 3,
      warehouseIds: [warehouse.id, warehouse2.id],
    },
    // 教学用新能源轿车（中等销量）
    {
      productId: productList[1].id,
      count: 8,
      warehouseIds: [warehouse.id, warehouse2.id],
    },
    // 科研用皮卡（低销量）
    { productId: productList[2].id, count: 2, warehouseIds: [warehouse.id] },
    // 后勤服务车（高销量）
    {
      productId: productList[3].id,
      count: 15,
      warehouseIds: [warehouse.id, warehouse2.id],
    },
  ];

  // 生成批量订单数据
  const orderData = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-03-01');

  for (const config of salesOrderConfig) {
    for (let i = 0; i < config.count; i++) {
      // 随机选择下单用户、仓库、下单时间
      const randomUser = userList[Math.floor(Math.random() * userList.length)];
      const randomWarehouseId =
        config.warehouseIds[
          Math.floor(Math.random() * config.warehouseIds.length)
        ];
      const randomDate = getRandomDate(startDate, endDate);

      orderData.push({
        productId: config.productId,
        userId: randomUser.id,
        warehouseId: randomWarehouseId,
        createtime: randomDate,
      });
    }
  }

  // 批量创建订单
  const salesOrders = await prisma.order.createMany({
    data: orderData,
    skipDuplicates: true,
  });

  console.log(`创建销量订单 ${salesOrders.count} 条`, salesOrders);

  // 补充：创建2025年最新订单（模拟近期销量）
  const latestOrders = await prisma.order.createMany({
    data: [
      // 2025年3月最新订单
      {
        productId: productList[1].id,
        userId: userList[1].id,
        warehouseId: warehouse.id,
        createtime: new Date('2025-03-10'),
      },
      {
        productId: productList[3].id,
        userId: userList[0].id,
        warehouseId: warehouse2.id,
        createtime: new Date('2025-03-15'),
      },
      {
        productId: productList[0].id,
        userId: adminUser.id,
        warehouseId: warehouse.id,
        createtime: new Date('2025-03-20'),
      },
    ],
    skipDuplicates: true,
  });
  console.log('创建2025年最新销量订单:', latestOrders);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
