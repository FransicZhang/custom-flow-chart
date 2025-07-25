![项目演示](assets/PixPin_2025-07-25_09-29-25.gif)

# Custom Flow Chart

## 项目简介

本项目是一个基于Vue 3的自定义流程图组件，支持节点自定义、拖拽、连线、属性配置等功能，适用于数据流、业务流程、任务流等多种场景。

## 目录结构

```
custom-flow-chart/
├── package.json             # 项目依赖配置
├── package-lock.json        # 锁定依赖版本
├── README.md                # 项目说明文档
└── src/
    ├── App.vue              # 入口组件
    ├── main.js              # 入口文件
    ├── components/          # 主要组件
    │   ├── CustomFlow.vue       # 流程图主组件
    │   ├── DataSourceNode.vue   # 数据源节点
    │   ├── MergeDialog.vue      # 合并弹窗
    │   ├── MergeNode.vue        # 合并节点
    │   └── utils.js             # 工具函数
    └── pages/
        └── index.vue        # 页面入口
```

## 安装与启动

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动项目：
   ```bash
   npm run serve
   ```

## 主要功能
- 支持自定义节点类型（如数据源节点、合并节点等）
- 节点可拖拽、连线，支持属性配置
- 可扩展弹窗、节点等自定义组件
- 响应式数据驱动，流程图动态更新

## 使用场景
- 数据处理流程可视化（如ETL、数据同步等）
- 业务流程建模（如审批流、订单流转等）
- 自动化运维编排（如CI/CD流程、自动化脚本等）
- 教学演示、算法流程展示

## 贡献与反馈
欢迎提交Issue或PR，提出建议和反馈。
