/**
 * Remark 插件：将相对路径图片转换为绝对路径
 * 
 * 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
 * 这样在编辑器中可以预览图片，编译后也能正确显示
 */
import { visit } from 'unist-util-visit';

export function remarkImagePath() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url && node.url.includes('/public/')) {
        // 将 ../../../public/images/xxx.png 转换为 /images/xxx.png
        node.url = node.url.replace(/^[./]*public\//, '/');
      }
    });
  };
}
