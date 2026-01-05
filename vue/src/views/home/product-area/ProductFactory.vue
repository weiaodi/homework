<template>
  <!-- 添加产品 -->
  <el-dialog
    title="添加产品"
    :visible.sync="dialogFormVisible"
    center
    width="600px"
    top="2%"
  >
    <el-form
      ref="form"
      :model="form"
      v-if="form"
      :rules="rules"
      status-icon
      label-width="80px"
      label-position="left"
      class="flex flex-col items-start"
    >
      <section class="w-80 h-36 my-6 self-center">
        <el-image
          v-if="form.poster"
          :src="form.poster"
          fit="cover"
          class="w-full h-full"
          :preview-src-list="[form.poster]"
        ></el-image>
        <el-empty v-if="!form.poster" class="w-full h-full"></el-empty>
      </section>
      <el-row class="flex justify-between">
        <el-form-item label="品牌" prop="name" class="mr-4">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model"></el-input>
        </el-form-item>
      </el-row>
      <el-row class="flex justify-between">
        <el-form-item label="售价" prop="price" class="mr-4">
          <el-input v-model="form.price">
            <span slot="suffix">万</span>
          </el-input>
        </el-form-item>
        <el-form-item label="车型" prop="poster">
          <el-select v-model="form.poster" placeholder="请选择车型" clearable>
            <el-option
              v-for="item in types"
              :key="item.poster"
              :label="item.label"
              :value="item.poster"
            >
              <el-image
                class="float-left w-10 h-full"
                :src="item.poster"
                fit="cover"
              ></el-image>
              <span class="float-right text-gray-500 font-bold">{{
                item.label
              }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-row>
      <el-form-item label="简介" prop="introduce" class="w-full">
        <el-input type="textarea" v-model="form.introduce"></el-input>
      </el-form-item>
    </el-form>
    <section slot="footer" class="dialog-footer">
      <el-button type="success" @click="submitForm('form')">立即创建</el-button>
      <el-button @click="resetForm('form')">重 置</el-button>
    </section>
  </el-dialog>
</template>

<script>
import { sleep } from '@/util/sleep';
import { createNamespacedHelpers } from 'vuex';
const { mapGetters, mapMutations, mapActions } =
  createNamespacedHelpers('productArea');
export default {
  name: 'ProductFactory',
  data() {
    let validatePrice = (rule, value, callback) => {
      if (isNaN(+value)) {
        callback(new Error('售价必须是数字'));
      } else if (+value >= 2000) {
        callback(new Error('售价不允许超过 2000 万'));
      } else {
        callback();
      }
    };
    return {
      form: {
        name: '',
        model: '',
        price: '',
        poster: '',
        introduce: '',
      },
      rules: {
        name: {
          required: true,
          message: '请输入当前产品品牌',
          trigger: 'blur',
        },
        model: {
          required: true,
          message: '请输入当前产品型号',
          trigger: 'blur',
        },
        price: [
          { required: true, message: '请输入当前产品售价', trigger: 'blur' },
          { validator: validatePrice, trigger: 'blur' },
        ],
        poster: {
          required: true,
          message: '请选择当前产品车型',
          trigger: 'change',
        },
        introduce: [
          { required: true, message: '请输入当前产品简介', trigger: 'blur' },
          {
            min: 1,
            max: 200,
            message: '简介应当在 1 到 200 个字符',
            trigger: 'blur',
          },
        ],
      },
      types: [
        {
          poster:
            'https://img11.kcimg.cn/officialpic/0/17/juozz.jpg_1200x800.jpg',
          label: '卡车',
        },
        {
          poster:
            'https://img1.xcarimg.com/news/3/36976/37807/846_20201021183253971595913723472.jpg',
          label: '客车',
        },
        {
          poster:
            'https://n.sinaimg.cn/sinakd20230210s/131/w974h757/20230210/ea7e-44e3fb305c52024beda51377128bea33.png',
          label: '中型轿车',
        },
        {
          poster:
            'https://img1.xcarimg.com/aikahao/f1/87/f187b27ec402916e7be25c07eac7f8e4.jpeg-w852wm0.jpg',
          label: '旅行车',
        },
        {
          poster:
            'https://tse4.mm.bing.net/th/id/OIP.0m87H3O3pVBxTat5CTrU0gHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
          label: '越野车',
        },
      ],
    };
  },
  computed: {
    ...mapGetters(['getDialogFormVisible', 'getProductTotal', 'getPageSize']),
    dialogFormVisible: {
      get() {
        return this.getDialogFormVisible;
      },
      set(newValue) {
        this.setDialogFormVisible(newValue);
      },
    },
  },
  methods: {
    ...mapMutations([
      'setDialogFormVisible',
      'setPage',
      'setSource',
      'setDataReady',
    ]),
    ...mapActions(['fetchSource', 'createProduct']),
    // 提交表单 - 创建新产品
    async submitForm(formName) {
      await this.$refs[formName].validate(async (valid) => {
        if (valid) {
          // 表单验证通过后...
          await this.createProduct(this.form);
          this.setDataReady(false);
          await sleep();
          this.setPage(Math.ceil(this.getProductTotal / this.getPageSize));
          const { source } = await this.fetchSource();
          this.setSource(source);
          this.setDialogFormVisible(false);
          this.setDataReady(true);
          this.$refs[formName].resetFields();
        } else return false;
      });
    },
    // 重置表单
    async resetForm(formName) {
      this.$refs[formName].resetFields();
    },
  },
};
</script>

<style></style>
