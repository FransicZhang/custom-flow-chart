<template>
    <div class="data-source-node" :data-node-id="data.id" :style="data.style">
        <div class="node-header">
            <i class="el-icon-database"></i>
            <span>数据源</span>
            <span class="node-alias">{{ localData.alias }}</span>
        </div>
        <div class="node-content">
            <!-- 端口区域 -->
            <div class="port port-out" title="输出端口" @mousedown.stop="$emit('port-mousedown', $event, 'out')"></div>
            <div class="form-item">
                <label>表名:</label>
                <el-input v-model="localData.tableName" placeholder="请输入表名" size="mini" @input="emitUpdate"
                    @click.stop></el-input>
            </div>
            <div class="form-item">
                <label>WHERE:</label>
                <el-input v-model="localData.whereCondition" placeholder="请输入WHERE条件" size="mini" type="textarea"
                    :rows="2" @input="emitUpdate" @click.stop></el-input>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DataSourceNode',
    props: {
        data: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            localData: { ...this.data }
        }
    },
    watch: {
        data: {
            handler(newVal) {
                this.localData = { ...newVal }
            },
            deep: true
        }
    },
    methods: {
        emitUpdate() {
            this.$emit('update:data', { ...this.localData })
        }
    }
}
</script>

<style scoped lang="less">
.data-source-node {
    width: 280px;
    background: #EFF4FF;
    border: 2px solid #5F95FF;
    border-radius: 8px;
    padding: 12px;
    font-size: 12px;

    .node-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-weight: bold;
        color: #5F95FF;

        .node-alias {
            font-weight: bold;
            font-size: 20px;
            margin-left: 20px;
        }

        i {
            margin-right: 6px;
            font-size: 14px;
        }
    }

    .node-content {
        .form-item {
            margin-bottom: 8px;

            &:last-child {
                margin-bottom: 0;
            }

            label {
                display: block;
                margin-bottom: 4px;
                color: #262626;
                font-weight: 500;
            }

            :deep(.el-input) {
                .el-input__inner {
                    height: 24px;
                    line-height: 24px;
                    font-size: 12px;
                    padding: 0 8px;
                }
            }

            :deep(.el-textarea) {
                .el-textarea__inner {
                    font-size: 12px;
                    padding: 4px 8px;
                    min-height: 40px;
                }
            }
        }
    }
}

.port {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #5F95FF;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    border: 2px solid #fff;
    box-shadow: 0 0 4px #5F95FF44;
    cursor: pointer;
}
</style>
