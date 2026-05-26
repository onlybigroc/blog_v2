/**
 * Remark 插件：将相对路径图片转换为绝对路径并添加原生懒加载
 *
 * 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
 * 使用原生 loading="lazy" 实现懒加载
 */
import { visit } from 'unist-util-visit';

export function remarkImagePath() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url && node.url.includes('/public/')) {
        // 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
        node.url = node.url.replace(/^[./]*public\//, '/');
      }

      if (node.url && !node.url.startsWith('http')) {
        if (!node.data) {
          node.data = {};
        }
        if (!node.data.hProperties) {
          node.data.hProperties = {};
        }
        node.data.hProperties.loading = 'lazy';
      }
    });
  };
}
