<template>
    <div class="merge-node" :data-node-id="data.id" :style="data.style">
        <div class="node-header">
            <i class="el-icon-connection"></i>
            <span>合并数据</span>

            <span class="node-alias">{{ localData.alias }}</span>
        </div>
        <div class="node-content">
            <!-- 端口区域 -->
            <div class="port-label port-label-in1">左表</div>
            <div class="port port-in port-in1" title="输入端口1"></div>
            <div class="port-label port-label-in2">右表</div>
            <div class="port port-in port-in2" title="输入端口2"></div>
            <div class="port port-out" title="输出端口" @mousedown.stop="$emit('port-mousedown', $event, 'out')"></div>
            <div class="form-item">
                <label>JOIN类型:</label>
                <el-select v-model="localData.joinType" placeholder="请选择JOIN类型" size="mini" @change="emitUpdate"
                    @click.stop>
                    <el-option label="INNER" value="INNER"></el-option>
                    <el-option label="LEFT" value="LEFT"></el-option>
                    <el-option label="RIGHT" value="RIGHT"></el-option>
                    <el-option label="FULL" value="FULL"></el-option>
                </el-select>
            </div>
            <div class="form-item">
                <label>ON条件:</label>
                <el-input v-model="localData.onCondition" placeholder="请输入ON条件" size="mini" @input="emitUpdate"
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
    name: 'MergeNode',
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
.merge-node {
    width: 300px;
    background: #F6FFED;
    border: 2px solid #52C41A;
    border-radius: 8px;
    padding: 12px;
    font-size: 12px;

    .node-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-weight: bold;
        color: #52C41A;

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

            :deep(.el-select) {
                width: 100%;

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
    background: #52C41A;
    border: 2px solid #fff;
    box-shadow: 0 0 4px #52C41A44;
    cursor: pointer;
}

.port-in1 {
    left: -10px;
    top: 30%;
    background: #52C41A;
    z-index: 10;
}

.port-in2 {
    left: -10px;
    top: 70%;
    background: #52C41A;
    z-index: 10;
}

.port-out {
    right: -10px;
    top: 50%;
    background: #52C41A;
}

.port-label {
    position: absolute;
    font-size: 12px;
    color: #888;
    z-index: 3;
    pointer-events: none;
}

.port-label-in1 {
    left: -38px;
    top: calc(28% - 20px);
}

.port-label-in2 {
    left: -38px;
    top: calc(68% - 20px);
}
</style>