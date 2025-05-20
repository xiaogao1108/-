$(document).ready(function() {
  // 页面加载完成后隐藏加载器
  setTimeout(function() {
    $('.page-loader').addClass('loaded');
  }, 500);
  
  // 初始化头像选择器
  if (typeof window.forceInitializeAvatar === 'function') {
    console.log("通过common.js初始化头像选择器");
    setTimeout(function() {
      window.forceInitializeAvatar();
    }, 300);
  }

  // 其他公共功能
}); 