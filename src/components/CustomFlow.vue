<template>
    <div class="flow-canvas-wrapper" @contextmenu.prevent="onCanvasContextMenu" @click="hideContextMenu"
        @wheel.prevent="onCanvasWheel" @mousedown="onWrapperMouseDown">
        <div ref="canvas" class="flow-canvas" @click="hideContextMenu" @dblclick="onCanvasDblClick"
            @mousedown="onCanvasMouseDown">
            <svg class="flow-links" :width="svgWidth" :height="svgHeight"
                style="position:absolute;left:0;top:0;z-index:2;pointer-events:none">
                <g>
                    <template v-for="link in links">
                        <path :d="link.path" :key="link.id" class="flow-link" />
                    </template>
                    <path v-if="tempLink" :d="tempLink.path" class="flow-link temp-link" />
                </g>
            </svg>
            <data-source-node v-for="node in nodes" v-if="node.type === 'data'" :key="node.id" :style="node.style"
                :data="node.data" @update:data="val => updateNodeData(node, val)"
                @mousedown.native="onNodeMouseDown($event, node)"
                @contextmenu.native.prevent="onNodeContextMenu($event, node)"
                @port-mousedown="(e, portType) => onPortMouseDown(e, node, portType)" />
            <merge-node v-for="node in nodes" v-if="node.type === 'merge'" :key="node.id" :style="node.style"
                :data="node.data" @mousedown.native="onNodeMouseDown($event, node)"
                @contextmenu.native.prevent="onNodeContextMenu($event, node)"
                @port-mousedown="(e, portType) => onPortMouseDown(e, node, portType)" />
        </div>
        <ul v-if="contextMenu.visible" class="context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
            <li @click="addDataNode">添加数据</li>
            <li @click="addMergeNode">合并数据</li>
            <li v-if="contextMenu.node" @click="deleteNode(contextMenu.node)">删除节点</li>
        </ul>
    </div>
</template>

<script>
import DataSourceNode from './DataSourceNode.vue'
import MergeNode from './MergeNode.vue'
import { generateAlias, getTransformedPosition, getMenuPosition, getBezierPath, filterLinks } from './utils.js'
export default {
    name: 'FlowDialog',
    components: { DataSourceNode, MergeNode },
    data() {
        return {
            nodes: [],
            links: [],
            tempLink: null,
            canvasWidth: 1300,
            canvasHeight: 500,
            contextMenu: { visible: false, x: 0, y: 0 },
            // 画布变换相关
            canvasTransform: {
                x: 0,
                y: 0,
                scale: 1
            },
            isDraggingCanvas: false,
        }
    },
    computed: {
        svgWidth() {
            return this.$refs.canvas ? this.$refs.canvas.offsetWidth : this.canvasWidth;
        },
        svgHeight() {
            return this.$refs.canvas ? this.$refs.canvas.offsetHeight : this.canvasHeight;
        }
    },
    methods: {
        handleShow() {
            this.$nextTick(() => {
                this.initGraph()
            });
        },
        initGraph() { },
        addDataNode() {
            const id = Date.now();
            const alias = generateAlias(this.nodes);
            // 计算菜单位置对应的画布坐标（已考虑缩放和平移）
            const x = (this.contextMenu.x - this.canvasTransform.x) / this.canvasTransform.scale;
            const y = (this.contextMenu.y - this.canvasTransform.y) / this.canvasTransform.scale;
            this.nodes.push({ id, type: 'data', data: { id, tableName: '', alias, whereCondition: '' }, style: { position: 'absolute', left: x + 'px', top: y + 'px' } });
            this.hideContextMenu();
        },
        addMergeNode() {
            const id = Date.now();
            const alias = generateAlias(this.nodes);
            // 计算菜单位置对应的画布坐标（已考虑缩放和平移）
            const x = (this.contextMenu.x - this.canvasTransform.x) / this.canvasTransform.scale;
            const y = (this.contextMenu.y - this.canvasTransform.y) / this.canvasTransform.scale;
            this.nodes.push({ id, type: 'merge', data: { id, alias, joinType: 'INNER', onCondition: '', whereCondition: '' }, style: { position: 'absolute', left: x + 'px', top: y + 'px' }, in1: null, in2: null });
            this.hideContextMenu();
        },
        onCanvasContextMenu(e) {
            const wrapperRect = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - wrapperRect.left;
            const py = e.clientY - wrapperRect.top;
            const { x, y } = getTransformedPosition(px, py, this.canvasTransform);
            const { x: menuX, y: menuY } = getMenuPosition(x, y, this.canvasTransform);
            const info = { visible: true, x: menuX, y: menuY, node: null };
            if (e.target.closest('.data-source-node, .merge-node')) {
                info.node = this.contextMenu.node;
            }
            this.contextMenu = info;
        },
        deleteNode(node) {
            // 删除节点
            this.nodes = this.nodes.filter(n => n.id !== node.id);
            // 删除与该节点相关的所有连线
            this.links = this.links.filter(link => link.from !== node.id && link.to !== node.id);
            this.hideContextMenu();
        },
        editMergeNode(node) { },
        onNodeContextMenu(e, node) {
            this.contextMenu = { visible: true, x: e.clientX, y: e.clientY, node };
        },
        onCanvasDblClick() { this.hideContextMenu() },
        // 新增：wrapper区域拖动画布
        onWrapperMouseDown(e) {
            // 如果点击的是节点或端口，不处理画布拖拽
            if (e.target.closest('.data-source-node, .merge-node, .port')) {
                return;
            }
            // 只允许鼠标左键拖拽
            if (e.button !== 0) return;
            e.preventDefault();
            this.isDraggingCanvas = true;
            const startX = e.clientX;
            const startY = e.clientY;
            const startTransformX = this.canvasTransform.x;
            const startTransformY = this.canvasTransform.y;
            const moveHandler = (evt) => {
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;
                this.canvasTransform.x = startTransformX + dx;
                this.canvasTransform.y = startTransformY + dy;
                this.updateCanvasStyle();
            };
            const upHandler = () => {
                this.isDraggingCanvas = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        },
        // 画布缩放
        onCanvasWheel(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.1, Math.min(3, this.canvasTransform.scale + delta));
            const wrapperRect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - wrapperRect.left;
            const mouseY = e.clientY - wrapperRect.top;
            const beforeX = (mouseX - this.canvasTransform.x) / this.canvasTransform.scale;
            const beforeY = (mouseY - this.canvasTransform.y) / this.canvasTransform.scale;
            this.canvasTransform.scale = newScale;
            const afterX = beforeX * newScale;
            const afterY = beforeY * newScale;
            this.canvasTransform.x = mouseX - afterX;
            this.canvasTransform.y = mouseY - afterY;
            this.updateCanvasStyle();
            // 缩放时也只需更新 transform，无需批量刷新节点和连线
        },
        deleteNode(node) {
            // 删除节点
            this.nodes = this.nodes.filter(n => n.id !== node.id);
            // 删除与该节点相关的所有连线
            this.links = this.links.filter(link => link.from !== node.id && link.to !== node.id);
            this.hideContextMenu();
        },
        hideContextMenu() {
            this.contextMenu.visible = false
        },
        onNodeMouseDown(e, node) {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const currentLeft = parseFloat(node.style.left) || 0;
            const currentTop = parseFloat(node.style.top) || 0;
            let rafId = null;
            const moveHandler = evt => {
                const dx = (evt.clientX - startX) / this.canvasTransform.scale;
                const dy = (evt.clientY - startY) / this.canvasTransform.scale;
                node.style.left = currentLeft + dx + 'px';
                node.style.top = currentTop + dy + 'px';
                if (!rafId) {
                    rafId = requestAnimationFrame(() => {
                        this.updateNodeLinks(node.id);
                        rafId = null;
                    });
                }
            };
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                this.updateNodeLinks(node.id);
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        },
        updateNodeData(node, val) {
            node.data = { ...val }
        },

        // 更新与指定节点相关的所有连线
        updateNodeLinks(nodeId) {
            this.$nextTick(() => {
                this.links.forEach(link => {
                    if (link.from === nodeId || link.to === nodeId) {
                        this.updateSingleLink(link);
                    }
                });
                // 再次 nextTick 强制刷新，确保节点 DOM 已重绘
                this.$nextTick(() => {
                    this.links.forEach(link => {
                        if (link.from === nodeId || link.to === nodeId) {
                            this.updateSingleLink(link);
                        }
                    });
                });
            });
        },
        // 更新单个连线
        // 工具函数：获取节点端口的画布内中心点坐标（直接用端口DOM）
        getPortCenter(node, portType) {
            // 端口选择器
            let portSelector = '';
            if (node.type === 'data' && portType === 'out') {
                portSelector = '.port-out';
            } else if (node.type === 'merge') {
                if (portType === 'out') portSelector = '.port-out';
                if (portType === 'in1') portSelector = '.port-in1';
                if (portType === 'in2') portSelector = '.port-in2';
            }
            const nodeEl = this.$refs.canvas.querySelector(`[data-node-id='${node.id}']`);
            const portEl = nodeEl ? nodeEl.querySelector(portSelector) : null;
            const canvasRect = this.$refs.canvas.getBoundingClientRect();
            if (portEl) {
                const portRect = portEl.getBoundingClientRect();
                // 修正：只减去 canvasRect，不再减 canvasTransform.x/y
                const x = (portRect.left + portRect.width / 2 - canvasRect.left) / this.canvasTransform.scale;
                const y = (portRect.top + portRect.height / 2 - canvasRect.top) / this.canvasTransform.scale;
                return { x, y };
            }
            // fallback: 旧逻辑
            const portSize = 14;
            let x = parseFloat(node.style.left);
            let y = parseFloat(node.style.top);
            const getNodeRect = (node) => {
                const nodeEl = this.$refs.canvas.querySelector(`[data-node-id='${node.id}']`);
                return nodeEl ? nodeEl.getBoundingClientRect() : null;
            };
            if (node.type === 'data') {
                const nodeRect = getNodeRect(node);
                const nodeHeight = nodeRect ? nodeRect.height : 112;
                x += 280;
                y += nodeHeight * 0.5;
            } else if (node.type === 'merge') {
                const nodeRect = getNodeRect(node);
                const nodeHeight = nodeRect ? nodeRect.height : 112;
                if (portType === 'out') {
                    x += 300 + 7;
                    y += nodeHeight * 0.5;
                } else if (portType === 'in1') {
                    x += -7;
                    y += nodeHeight * 0.3;
                } else if (portType === 'in2') {
                    x += -7;
                    y += nodeHeight * 0.7;
                }
            }
            x += portSize / 2;
            y += portSize / 2;
            return { x, y };
        },
        // 工具函数：SVG坐标无需再做canvasToScreen变换
        canvasToScreen(x, y) {
            return { x, y };
        },
        // 重构后的 updateSingleLink
        updateSingleLink(link) {
            const fromNode = this.nodes.find(n => n.id === link.from);
            const toNode = this.nodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return;
            // 获取端口中心点（画布内坐标）
            const fromPort = this.getPortCenter(fromNode, 'out');
            const toPort = this.getPortCenter(toNode, link.toPort);
            // 转为屏幕坐标
            const fromScreen = this.canvasToScreen(fromPort.x, fromPort.y);
            const toScreen = this.canvasToScreen(toPort.x, toPort.y);
            link.path = getBezierPath(fromScreen.x, fromScreen.y, toScreen.x, toScreen.y);
        },
        onNodeMouseDown(e, node) {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const currentLeft = parseFloat(node.style.left) || 0;
            const currentTop = parseFloat(node.style.top) || 0;
            const moveHandler = evt => {
                const dx = (evt.clientX - startX) / this.canvasTransform.scale;
                const dy = (evt.clientY - startY) / this.canvasTransform.scale;
                node.style.left = currentLeft + dx + 'px';
                node.style.top = currentTop + dy + 'px';
                this.updateNodeLinks(node.id);
            };
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                this.updateNodeLinks(node.id);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        },
        onCanvasMouseDown(e) {
            // 兼容旧逻辑，后续可移除
            if (e.target.closest('.data-source-node, .merge-node, .port')) {
                return;
            }
            if (e.button !== 0) return;
            e.preventDefault();
            this.isDraggingCanvas = true;
            const startX = e.clientX;
            const startY = e.clientY;
            const startTransformX = this.canvasTransform.x;
            const startTransformY = this.canvasTransform.y;
            const moveHandler = (evt) => {
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;
                this.canvasTransform.x = startTransformX + dx;
                this.canvasTransform.y = startTransformY + dy;
                this.updateCanvasStyle();
            };
            const upHandler = () => {
                this.isDraggingCanvas = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        },
        // 画布缩放
        onCanvasWheel(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.1, Math.min(3, this.canvasTransform.scale + delta));
            const wrapperRect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - wrapperRect.left;
            const mouseY = e.clientY - wrapperRect.top;
            const beforeX = (mouseX - this.canvasTransform.x) / this.canvasTransform.scale;
            const beforeY = (mouseY - this.canvasTransform.y) / this.canvasTransform.scale;
            this.canvasTransform.scale = newScale;
            const afterX = beforeX * newScale;
            const afterY = beforeY * newScale;
            this.canvasTransform.x = mouseX - afterX;
            this.canvasTransform.y = mouseY - afterY;

            this.updateCanvasStyle();
        },
        // 端口拖拽连线相关方法
        onPortMouseDown(e, node, portType) {
            e.stopPropagation();
            if (!["out", "in1", "in2"].includes(portType)) return;
            let startX, startY;
            const canvasRect = this.$refs.canvas.getBoundingClientRect();
            if (portType === "out") {
                const portEl = e.target;
                const portRect = portEl.getBoundingClientRect();
                startX = (portRect.left + portRect.width / 2 - canvasRect.left) / this.canvasTransform.scale;
                startY = (portRect.top + portRect.height / 2 - canvasRect.top) / this.canvasTransform.scale;
            } else {
                let portClass = portType === "in1" ? ".port-in1" : ".port-in2";
                const nodeEl = this.$refs.canvas.querySelector(`[data-node-id='${node.id}']`);
                const portEl = nodeEl ? nodeEl.querySelector(portClass) : null;
                if (portEl) {
                    const portRect = portEl.getBoundingClientRect();
                    startX = (portRect.left + portRect.width / 2 - canvasRect.left) / this.canvasTransform.scale;
                    startY = (portRect.top + portRect.height / 2 - canvasRect.top) / this.canvasTransform.scale;
                } else {
                    const portOffsetX = 0;
                    const portOffsetY = 24;
                    startX = parseFloat(node.style.left) + portOffsetX;
                    startY = parseFloat(node.style.top) + portOffsetY / 2;
                    if (portType === "in2") {
                        startY += portOffsetY;
                    }
                }
            }
            this.tempLink = { from: node.id, portType, startX, startY, path: '' };
            const moveHandler = evt => {
                const x2 = (evt.clientX - canvasRect.left) / this.canvasTransform.scale;
                const y2 = (evt.clientY - canvasRect.top) / this.canvasTransform.scale;
                this.tempLink.path = getBezierPath(startX, startY, x2, y2);
            };
            const upHandler = evt => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                const target = document.elementFromPoint(evt.clientX, evt.clientY);
                if (target && target.classList.contains('port-in1')) {
                    const mergeNodeEl = target.closest('.merge-node');
                    const toId = mergeNodeEl ? parseInt(mergeNodeEl.getAttribute('data-node-id')) : null;
                    this.addLink(node.id, toId, 'in1');
                } else if (target && target.classList.contains('port-in2')) {
                    const mergeNodeEl = target.closest('.merge-node');
                    const toId = mergeNodeEl ? parseInt(mergeNodeEl.getAttribute('data-node-id')) : null;
                    this.addLink(node.id, toId, 'in2');
                }
                this.tempLink = null;
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        },
        updateCanvasStyle() {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
            }
            this._rafId = requestAnimationFrame(() => {
                const canvas = this.$refs.canvas;
                if (canvas) {
                    Object.assign(canvas.style, {
                        transform: `translate(${this.canvasTransform.x}px, ${this.canvasTransform.y}px) scale(${this.canvasTransform.scale})`,
                        transformOrigin: '0 0',
                        cursor: this.isDraggingCanvas ? 'grabbing' : 'grab'
                    });
                }
            });
        },
        addLink(fromId, toId, toPort) {
            if (!fromId || !toId || !toPort) {
                return;
            }
            // 保证同一个 in 端口只能有一条线
            this.links = this.links.filter(link => !(link.to === toId && link.toPort === toPort));
            const fromNode = this.nodes.find(n => n.id === fromId);
            const toNode = this.nodes.find(n => n.id === toId);
            if (!fromNode || !toNode) {
                return;
            }
            // 记录连接关系
            toNode[toPort] = fromId;
            // 创建连线对象
            const linkObj = { id: `${fromId}_${toId}_${toPort}`, from: fromId, to: toId, toPort, path: '' };
            this.links.push(linkObj);
            // 使用updateSingleLink方法计算路径
            this.$nextTick(() => {
                this.updateSingleLink(linkObj);
            });
        },

        onSaveFlow() {
            // 打印流程图配置数据
            console.log('[流程图配置]', { nodes: this.nodes, links: this.links });
            return {
                nodes: this.nodes,
                links: this.links
            }
        }
    }
}
</script>

<style lang="less" scoped>
.flow-canvas-wrapper {
    position: relative;
    width: calc(100%);
    height: calc(100vh - 180px);
    background: #f5f7fa;
    /* 兼容低版本浏览器的纵横线背景，优先SVG base64，其次渐变 */
    background-image: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="20" height="20" fill="none"/><path d="M 0 0 H 20" stroke="rgba(0,0,0,0.1)" stroke-width="1"/><path d="M 0 0 V 20" stroke="rgba(0,0,0,0.1)" stroke-width="1"/></svg>');
    background-size: 20px 20px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    user-select: none;
}

.flow-canvas {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    transition: transform 0.1s ease-out;
}

.context-menu {
    position: absolute;
    z-index: 10;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
    min-width: 120px;
    list-style: none;
}

.context-menu li {
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s;
}

.context-menu li:hover {
    background: #f0f0f0;
}

.flow-links {
    pointer-events: none;
    overflow: visible !important;
}

.flow-link {
    stroke: #5F95FF;
    stroke-width: 3;
    fill: none;
    stroke-dasharray: 8, 4;
    animation: ant-line 1s linear infinite;
}

.temp-link {
    stroke: #aaa;
    stroke-width: 2;
    stroke-dasharray: 4, 4;
    opacity: 0.7;
}

@keyframes ant-line {
    to {
        stroke-dashoffset: -12;
    }
}
</style>
