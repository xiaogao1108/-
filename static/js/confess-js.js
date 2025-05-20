document.addEventListener('DOMContentLoaded', function () {
    console.log("表白墙 JS 已加载");

    // 页面加载动画
    setTimeout(function() {
        document.querySelector('.page-loader').classList.add('loaded');
    }, 800);

    // 滚动进度条
    window.addEventListener('scroll', function() {
        let scrollTop = window.scrollY;
        let docHeight = document.documentElement.scrollHeight - window.innerHeight;
        let scrollPercent = (scrollTop / docHeight) * 100;
        document.querySelector('.scroll-progress').style.width = scrollPercent + '%';
        
        // 回到顶部按钮显示/隐藏
        const scrollBtn = document.querySelector('.scroll-to-top');
        if (scrollTop > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    // 回到顶部按钮点击事件
    document.querySelector('.scroll-to-top').addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 动画效果
    const animateElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // 头像选择器
    const currentAvatar = document.getElementById("current-avatar");
    const avatarSelector = document.getElementById("avatar-selector");

    if (currentAvatar && avatarSelector) {
        currentAvatar.addEventListener("click", () => {
            avatarSelector.classList.toggle("hidden");
        });

        // 点击页面其他地方关闭头像选择器
        document.addEventListener("click", (event) => {
            if (!currentAvatar.contains(event.target) && !avatarSelector.contains(event.target)) {
                avatarSelector.classList.add("hidden");
            }
        });
        
        // 点击默认头像选择并提交
        document.querySelectorAll(".avatar-option").forEach(option => {
            option.addEventListener("click", () => {
                const avatarPath = option.getAttribute("data-path");

                // 更新当前显示的头像
                document.getElementById("current-avatar").src = "/media/" + avatarPath;

                // 发送 AJAX 请求保存选择
                fetch("/homepage/select_default_avatar/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-CSRFToken": getCookie("csrftoken")
                    },
                    body: "avatar_path=" + encodeURIComponent(avatarPath)
                }).then(response => {
                    if (response.ok) {
                        console.log("头像已更新");
                    }
                });

                // 关闭选择器
                document.getElementById("avatar-selector").classList.add("hidden");
            });
        });
    }
    
    // 退出登录确认
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const confirmed = confirm("确定退出登录吗？");
            if (confirmed) {
                window.location.href = this.href;
            }
        });
    }

    // 处理发布表白弹窗显示/隐藏
    const showConfessFormBtn = document.getElementById('show-confess-form');
    const confessFormOverlay = document.getElementById('confess-form-overlay');
    const confessFormPopup = document.getElementById('confess-form-popup');
    const closeConfessFormBtn = document.getElementById('close-confess-form');
    const cancelConfessBtn = document.getElementById('cancel-confess');

    if (showConfessFormBtn && confessFormOverlay) {
        showConfessFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            confessFormOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    }

    if (closeConfessFormBtn && confessFormOverlay) {
        closeConfessFormBtn.addEventListener('click', function() {
            confessFormOverlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        });
    }

    if (cancelConfessBtn && confessFormOverlay) {
        cancelConfessBtn.addEventListener('click', function() {
            confessFormOverlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        });
    }

    // 点击弹窗外关闭
    if (confessFormOverlay) {
        confessFormOverlay.addEventListener('click', function(e) {
            if (e.target === confessFormOverlay) {
                confessFormOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // 表白点赞/点踩效果
    document.querySelectorAll('.btn-vote').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // 这里可以加入点赞前的检查，比如是否登录
            if (!document.querySelector('.user-area')) {
                e.preventDefault();
                alert('请先登录后再进行操作');
            }
        });
    });

    // 匿名选项切换昵称输入框
    const anonymousCheckbox = document.getElementById('is_anonymous');
    const authorNameGroup = document.querySelector('.author-name-group');
    const authorNameInput = document.getElementById('author_name');
    
    if (anonymousCheckbox && authorNameGroup && authorNameInput) {
        // 添加过渡效果的CSS
        authorNameGroup.style.transition = 'all 0.3s ease-in-out';
        authorNameGroup.style.maxHeight = '60px';
        authorNameGroup.style.opacity = '1';
        authorNameGroup.style.overflow = 'hidden';

        anonymousCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // 如果选中匿名，隐藏昵称输入框并移除必填属性
                authorNameGroup.style.maxHeight = '0';
                authorNameGroup.style.opacity = '0';
                authorNameGroup.style.marginBottom = '0';
                setTimeout(() => {
                    authorNameGroup.classList.add('hidden');
                    authorNameInput.removeAttribute('required');
                }, 300);
            } else {
                // 如果取消匿名，显示昵称输入框并添加必填属性
                authorNameGroup.classList.remove('hidden');
                setTimeout(() => {
                    authorNameGroup.style.maxHeight = '60px';
                    authorNameGroup.style.opacity = '1';
                    authorNameGroup.style.marginBottom = '20px';
                    authorNameInput.setAttribute('required', '');
                }, 10);
            }
        });
    }

    // 打字动画效果
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

    // 工具函数：获取cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
}); 