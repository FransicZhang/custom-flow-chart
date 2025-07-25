<template>
  <el-dialog :title="title" :visible.sync="visible" width="1300px" @close="handleClose" top="10px">
    <el-form :model="form" :rules="rules" ref="form" inline label-width="120px">
      <el-form-item label="Factory" prop="factory">
        <el-select v-model="form.factory" placeholder="请选择Factory" filterable clearable>
          <el-option v-for="item in factoryOptions" :key="item.value" :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Trigger Oper" prop="triggerOper">
        <el-input v-model="form.triggerOper" placeholder="请输入Trigger Oper"></el-input>
      </el-form-item>

      <el-form-item label="Base Oper" prop="baseOper">
        <el-input v-model="form.baseOper" placeholder="请输入Base Oper"></el-input>
      </el-form-item>

      <el-form-item label="Combine Oper" prop="combineOper">
        <el-input v-model="form.combineOper" placeholder="请输入Combine Oper"></el-input>
      </el-form-item>

      <el-form-item label="Product" prop="product">
        <el-input v-model="form.product" placeholder="请输入Product"></el-input>
      </el-form-item>

      <el-form-item label="半径(um)" prop="radius">
        <el-input-number v-model="form.radius" :min="0" :step="1" placeholder="请输入半径"></el-input-number>
      </el-form-item>

      <el-form-item label="存放路径" prop="path">
        <el-input v-model="form.path" placeholder="请输入存放路径"></el-input>
      </el-form-item>
    </el-form>

    <FlowDialog ref="flow-dialog" />

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import FlowDialog from './FlowDialog.vue';

export default {
  name: 'MergeDialog',
  components: { FlowDialog },
  props: {
    title: {
      type: String,
      default: '合并文件'
    }
  },
  data() {
    return {
      visible: false,
      form: {
        factory: '',
        triggerOper: '',
        baseOper: '',
        combineOper: '',
        product: '',
        radius: 0,
        path: ''
      },
      rules: {
        factory: [{ required: true, message: '请选择Factory', trigger: 'change' }],
        triggerOper: [{ required: true, message: '请输入Trigger Oper', trigger: 'blur' }],
        baseOper: [{ required: true, message: '请输入Base Oper', trigger: 'blur' }],
        combineOper: [{ required: true, message: '请输入Combine Oper', trigger: 'blur' }],
        product: [{ required: true, message: '请输入Product', trigger: 'blur' }],
        path: [{ required: true, message: '请输入存放路径', trigger: 'blur' }]
      },
      factoryOptions: []
    };
  },
  methods: {
    handleClose() {
      this.visible = false
    },
    handleCancel() {
      this.visible = false
    },
    handleShow() {
      this.visible = true
    },
    handleSubmit() {
      const dataConfig = this.$refs['flow-dialog'].onSaveFlow()
      console.log(dataConfig)

      this.$refs.form.validate(valid => {
        if (valid) {
          this.$emit('submit', this.form);
          this.visible = false
        }
      });
    },
    resetForm() {
      this.$refs.form.resetFields();
    }
  }
};
</script>

<style scoped lang="less"></style>