import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 辅助函数：生成指定范围内的随机日期
function getRandomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function main() {
  // ==============================================
  // 第一步：按关联顺序清空所有旧数据（避免外键约束报错）
  // ==============================================
  console.log('开始清空旧数据...');

  await prisma.order.deleteMany({});
  await prisma.supply.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('旧数据清空完成！\n');

  // ==============================================
  // 第二步：创建基础数据（用户、仓库、供应商、产品）
  // ==============================================

  // 1. 创建用户（管理员 + 普通员工）
  const adminUser = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      username: '大连交大管理员',
      password: '123456', // 生产环境务必加密
      phone: '13800138000',
      role: 'ADMIN',
      address: '辽宁省大连市沙河口区黄河路794号大连交通大学',
      avatar:
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    },
  });

  const normalUsers = await prisma.user.createMany({
    data: [
      {
        username: '大连交大后勤采购员',
        password: '123456',
        phone: '13500135000',
        role: 'USER',
        address: '大连交大后勤处',
      },
      {
        username: '大连交大汽车学院教员',
        password: '123456',
        phone: '13400134000',
        role: 'USER',
        address: '大连交大汽车工程学院',
      },
      {
        username: '大连交大科研助理',
        password: '123456',
        phone: '13200132000',
        role: 'USER',
        address: '大连交大科研处',
      },
      {
        username: '大连交大资产管理员',
        password: '123456',
        phone: '13100131000',
        role: 'USER',
        address: '大连交大资产管理处',
      },
      {
        username: '大连交大旅顺校区采购员',
        password: '123456',
        phone: '13000130000',
        role: 'USER',
        address: '大连交大旅顺校区',
      },
    ],
    skipDuplicates: true,
  });
  const userList = await prisma.user.findMany();
  console.log('创建用户完成:', {
    admin: adminUser.username,
    normalCount: normalUsers.count,
  });

  // 2. 创建3个仓库（覆盖不同校区/用途）
  const [warehouseHuanghe, warehouseLushun, warehouseOffice] =
    await Promise.all([
      prisma.warehouse.create({
        data: { location: '大连交大黄河路校区后勤仓库' },
      }),
      prisma.warehouse.create({
        data: { location: '大连交大旅顺校区物流仓库' },
      }),
      prisma.warehouse.create({ data: { location: '大连交大科研专用仓库' } }), // 专门存放科研车辆
    ]);
  const warehouseList = [warehouseHuanghe, warehouseLushun, warehouseOffice];
  console.log(
    '创建仓库完成:',
    warehouseList.map((w) => w.location),
  );

  // 3. 创建供应商（新增科研车辆专属供应商）
  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        name: '大连交大汽车工程学院供应商',
        phone: '13900139000',
        company: '大连交大产学研合作中心',
      },
      {
        name: '大连交大后勤车辆供应部',
        phone: '13700137000',
        company: '大连交大后勤保障处',
      },
      {
        name: '大连交大新能源汽车研发中心',
        phone: '13600136000',
        company: '大连交大新能源汽车研究所',
      },
      {
        name: '大连交大特种科研车辆供应商',
        phone: '13000130001',
        company: '大连交大特种装备采购中心',
      }, // 长城炮专属供应商
    ],
    skipDuplicates: true,
  });
  const supplierList = await prisma.supplier.findMany();
  console.log('创建供应商完成:', { count: supplierList.length });

  // 4. 创建产品（保持原有车型，完善描述）
  const products = await prisma.product.createMany({
    data: [
      {
        name: '大连交大通勤大巴',
        model: '宇通ZK6122HQ',
        price: 850000.0,
        introduce:
          '校区间师生接送专用，配备空调、舒适座椅，符合高校通勤安全标准',
        poster:
          'https://th.bing.com/th/id/R.e1ea85f01044a1a5cb87b184385caf12?rik=l7eR3VTe2f1V7Q&riu=http%3a%2f%2fimgwww.yutong.com%2fimage%2fproduct%2f20151126%2f2015KZQyMEa5a6.jpg&ehk=MSeTYKZAU8I2pZPlhV%2f8fgKCpBcPWY9Y4oEWUUo%2bano%3d&risl=&pid=ImgRaw&r=0',
      },
      {
        name: '大连交大教学用新能源轿车',
        model: '比亚迪秦PLUS DM-i',
        price: 159800.0,
        introduce: '汽车工程学院教学专用，用于新能源汽车原理教学、学生实操训练',
        poster:
          'https://th.bing.com/th/id/R.70147092b4e54b941d0fcf10a016e04c?rik=0woemJW9wHADJQ&riu=http%3a%2f%2fimg.pcauto.com.cn%2fimages%2fttauto%2f2023%2f02%2f08%2f7197324974594769445%2ffbb01fed3d8546888a156425a43e425f.png&ehk=UHJNObBTNJdX4XqMh%2bOVwMmwL7xTRCKG2xkFAYa08BA%3d&risl=&pid=ImgRaw&r=0',
      },
      {
        name: '大连交大科研用皮卡',
        model: '长城炮 2.0T 四驱版',
        price: 126800.0,
        introduce:
          '道路工程研究所科研专用，四驱越野，适配野外路况检测、数据采集、设备运输',
        poster:
          'https://tse4.mm.bing.net/th/id/OIP.0m87H3O3pVBxTat5CTrU0gHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
      },
      {
        name: '大连交大后勤服务车',
        model: '五菱宏光PLUS',
        price: 69800.0,
        introduce: '后勤保障处专用，用于校园物资运输、设备维修、日常通勤',
        poster:
          'https://th.bing.com/th/id/R.61f2c27c75cdd3e14e0ab008ae04ecf8?rik=YERmaIOXtp6y5Q&riu=http%3a%2f%2fp4.itc.cn%2fc_cut%2cx_0%2cy_0%2cw_1680%2ch_1120%2fimages01%2f20200515%2fbf384faa7f2b4f24b8ae8a81fdf2f89b.jpeg&ehk=%2bYH7u4xO77t1vuhqThRXrbtwYU1VZEXjhX8Clr5F%2fVc%3d&risl=&pid=ImgRaw&r=0',
      },
    ],
    skipDuplicates: true,
  });
  const productList = await prisma.product.findMany();
  // 提取各产品ID（方便后续关联）
  const [busId, evCarId, pickupId, wulingId] = productList.map((p) => p.id);
  console.log(
    '创建产品完成:',
    productList.map((p) => p.name),
  );

  // ==============================================
  // 第三步：重点补全长城炮库存 + 供应数据
  // ==============================================

  // 1. 供应记录：长城炮由专属供应商供应，3个仓库均有备货
  const supplyData = [
    // 其他车型供应
    {
      quantity: 15,
      supplierId: supplierList[0].id,
      productId: evCarId,
      warehouseId: warehouseHuanghe.id,
      createtime: new Date(),
    },
    {
      quantity: 8,
      supplierId: supplierList[1].id,
      productId: busId,
      warehouseId: warehouseHuanghe.id,
      createtime: new Date(),
    },
    {
      quantity: 30,
      supplierId: supplierList[1].id,
      productId: wulingId,
      warehouseId: warehouseHuanghe.id,
      createtime: new Date(),
    },
    {
      quantity: 12,
      supplierId: supplierList[0].id,
      productId: evCarId,
      warehouseId: warehouseLushun.id,
      createtime: getRandomDate(new Date('2024-01-01'), new Date('2024-12-31')),
    },
    {
      quantity: 25,
      supplierId: supplierList[1].id,
      productId: wulingId,
      warehouseId: warehouseLushun.id,
      createtime: getRandomDate(new Date('2024-01-01'), new Date('2024-12-31')),
    },
    {
      quantity: 10,
      supplierId: supplierList[0].id,
      productId: evCarId,
      warehouseId: warehouseOffice.id,
      createtime: getRandomDate(new Date('2024-01-01'), new Date('2024-12-31')),
    },
    // 长城炮重点供应：3个仓库，总供应量达25台（科研需求大）
    {
      quantity: 10,
      supplierId: supplierList[3].id,
      productId: pickupId,
      warehouseId: warehouseHuanghe.id,
      createtime: new Date(),
    },
    {
      quantity: 8,
      supplierId: supplierList[3].id,
      productId: pickupId,
      warehouseId: warehouseLushun.id,
      createtime: getRandomDate(new Date('2024-01-01'), new Date('2024-12-31')),
    },
    {
      quantity: 7,
      supplierId: supplierList[3].id,
      productId: pickupId,
      warehouseId: warehouseOffice.id,
      createtime: getRandomDate(new Date('2024-01-01'), new Date('2024-12-31')),
    },
  ];
  const supplies = await prisma.supply.createMany({
    data: supplyData,
    skipDuplicates: true,
  });
  console.log('创建供应记录完成:', {
    totalCount: supplies.count,
    长城炮供应: 3,
  });

  // 2. 库存数据：长城炮3个仓库库存充足，总库存18台
  const inventoryData = [
    // 其他车型库存
    { productId: busId, warehouseId: warehouseHuanghe.id, quantity: 12 },
    { productId: busId, warehouseId: warehouseLushun.id, quantity: 6 },
    { productId: busId, warehouseId: warehouseOffice.id, quantity: 2 },
    { productId: evCarId, warehouseId: warehouseHuanghe.id, quantity: 20 },
    { productId: evCarId, warehouseId: warehouseLushun.id, quantity: 10 },
    { productId: evCarId, warehouseId: warehouseOffice.id, quantity: 8 },
    { productId: wulingId, warehouseId: warehouseHuanghe.id, quantity: 35 },
    { productId: wulingId, warehouseId: warehouseLushun.id, quantity: 28 },
    { productId: wulingId, warehouseId: warehouseOffice.id, quantity: 22 },
    // 长城炮重点库存：每个仓库均有留存，满足科研备用需求
    { productId: pickupId, warehouseId: warehouseHuanghe.id, quantity: 6 },
    { productId: pickupId, warehouseId: warehouseLushun.id, quantity: 5 },
    { productId: pickupId, warehouseId: warehouseOffice.id, quantity: 7 },
  ];
  const inventories = await prisma.inventory.createMany({
    data: inventoryData,
    skipDuplicates: true,
  });
  console.log('创建库存完成:', {
    totalCount: inventories.count,
    长城炮总库存: 18,
  });

  // ==============================================
  // 第四步：重点补全长城炮销量订单（科研需求驱动，订单量提升）
  // ==============================================

  // 订单配置：长城炮订单量提升至15单，覆盖3个仓库
  const salesOrderConfig = [
    {
      productId: busId,
      count: 6,
      warehouseIds: [warehouseHuanghe.id, warehouseLushun.id],
    }, // 通勤大巴
    {
      productId: evCarId,
      count: 18,
      warehouseIds: warehouseList.map((w) => w.id),
    }, // 教学新能源车
    {
      productId: pickupId,
      count: 15,
      warehouseIds: warehouseList.map((w) => w.id),
    }, // 长城炮（重点提升）
    {
      productId: wulingId,
      count: 35,
      warehouseIds: warehouseList.map((w) => w.id),
    }, // 后勤服务车
  ];

  // 生成批量订单数据
  const orderData = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-03-01');

  for (const config of salesOrderConfig) {
    for (let i = 0; i < config.count; i++) {
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
  console.log(`创建批量订单完成: 共 ${salesOrders.count} 条`);

  // 2025年最新订单：新增3条长城炮近期订单（模拟科研采购需求）
  const latestOrders = await prisma.order.createMany({
    data: [
      // 其他车型近期订单
      {
        productId: evCarId,
        userId: userList[1].id,
        warehouseId: warehouseHuanghe.id,
        createtime: new Date('2025-03-10'),
      },
      {
        productId: wulingId,
        userId: userList[0].id,
        warehouseId: warehouseLushun.id,
        createtime: new Date('2025-03-15'),
      },
      {
        productId: busId,
        userId: adminUser.id,
        warehouseId: warehouseHuanghe.id,
        createtime: new Date('2025-03-20'),
      },
      // 长城炮近期科研采购订单
      {
        productId: pickupId,
        userId: userList[2].id,
        warehouseId: warehouseOffice.id,
        createtime: new Date('2025-03-22'),
      },
      {
        productId: pickupId,
        userId: userList[3].id,
        warehouseId: warehouseLushun.id,
        createtime: new Date('2025-03-25'),
      },
      {
        productId: pickupId,
        userId: userList[4].id,
        warehouseId: warehouseHuanghe.id,
        createtime: new Date('2025-03-28'),
      },
    ],
    skipDuplicates: true,
  });
  console.log(
    `创建2025年最新订单完成: 共 ${latestOrders.count} 条，其中长城炮3条`,
  );

  console.log('\n✅ 所有数据创建完成！长城炮库存和销量已重点补全');
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
