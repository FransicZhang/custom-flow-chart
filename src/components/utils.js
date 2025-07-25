// 公共工具函数

// 生成唯一别名（A-Z）
export function generateAlias(nodes) {
  const usedAliases = nodes.filter(n => n.type === 'data' || n.type === 'merge').map(n => n.data.alias).filter(Boolean);
  for (let i = 0; i < 26; i++) {
    const char = String.fromCharCode(65 + i);
    if (!usedAliases.includes(char)) {
      return char;
    }
  }
  return '';
}

// 计算缩放和平移后的坐标
export function getTransformedPosition(px, py, transform) {
  return {
    x: (px - transform.x) / transform.scale,
    y: (py - transform.y) / transform.scale
  };
}

// 计算菜单绝对坐标
export function getMenuPosition(x, y, transform) {
  return {
    x: x * transform.scale + transform.x,
    y: y * transform.scale + transform.y
  };
}

// 生成贝塞尔曲线路径
export function getBezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

// 过滤节点连线
export function filterLinks(links, nodeId) {
  return links.filter(link => link.from !== nodeId && link.to !== nodeId);
}