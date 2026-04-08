/**
 * Remark 插件：将相对路径图片转换为绝对路径并添加懒加载支持
 * 
 * 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
 * 并为图片添加 data-src 属性和 lazy 类，实现懒加载
 * 这样在编辑器中可以预览图片，编译后也能正确显示和懒加载
 */
import { visit } from 'unist-util-visit';

export function remarkImagePath() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url && node.url.includes('/public/')) {
        // 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
        const absoluteUrl = node.url.replace(/^[./]*public\//, '/');
        
        // 为图片添加懒加载属性
        if (!node.data) {
          node.data = {};
        }
        if (!node.data.hProperties) {
          node.data.hProperties = {};
        }
        
        // 设置 data-src 属性为图片路径
        node.data.hProperties['data-src'] = absoluteUrl;
        // 添加 lazy 类
        node.data.hProperties.className = (node.data.hProperties.className || '') + ' lazy';
        // 使用空字符串作为 src，确保图片不会立即加载
        node.url = '';
      }
    });
  };
}
