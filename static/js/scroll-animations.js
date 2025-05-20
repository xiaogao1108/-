// 滚动动画处理

// 在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取所有具有reveal类的元素
  const revealElements = document.querySelectorAll('.reveal');
  
  // 初始化Intersection Observer
  const observerOptions = {
    root: null, // 使用视口作为参考
    rootMargin: '0px', // 没有外边距
    threshold: 0.15 // 元素15%可见时触发
  };
  
  // 创建观察者实例
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // 当元素进入视口
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);
  
  // 对所有reveal元素应用观察者
  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
  
  // 为导航栏添加滚动阴影效果
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        navbar.classList.add('navbar-shadow');
      } else {
        navbar.classList.remove('navbar-shadow');
      }
    });
    
    // 立即检查以设置初始状态
    if (window.scrollY > 10) {
      navbar.classList.add('navbar-shadow');
    }
  }
  
  // 添加平滑滚动到锚点的功能
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // 只处理实际的锚点链接
      if (targetId !== '#' && document.querySelector(targetId)) {
        e.preventDefault();
        
        const targetElement = document.querySelector(targetId);
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // 添加滚动到顶部按钮
  const scrollTopButton = document.querySelector('.scroll-to-top');
  if (scrollTopButton) {
    // 监听滚动以显示/隐藏滚动到顶部按钮
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        scrollTopButton.classList.add('visible');
      } else {
        scrollTopButton.classList.remove('visible');
      }
    });
    
    // 点击滚动到顶部
    scrollTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // 滚动进度指示器
  const progressIndicator = document.querySelector('.scroll-progress');
  if (progressIndicator) {
    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      progressIndicator.style.width = `${progress}%`;
    });
  }
  
  // 页面加载动画
  setTimeout(function() {
    const pageLoader = document.querySelector('.page-loader');
    if (pageLoader) {
      pageLoader.classList.add('loaded');
    }
  }, 800);

  // 链接元素悬停效果
  const chainItems = document.querySelectorAll('.chain-item');
  chainItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    });
  });

  // 打字动画
  const typingElements = document.querySelectorAll('.typing-text');
  typingElements.forEach(element => {
    const text = element.textContent;
    const speed = parseInt(element.dataset.speed) || 50;
    const delay = parseInt(element.dataset.delay) || 0;
    
    element.textContent = '';
    
    setTimeout(() => {
      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, speed);
        }
      };
      typeWriter();
    }, delay);
  });
}); 