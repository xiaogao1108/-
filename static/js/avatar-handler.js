/**
 * 头像处理脚本
 * 用于处理默认头像的显示、选择和自定义头像上传
 */

// 优化: 创建一个全局变量跟踪事件是否已绑定，避免重复绑定事件
window.avatarHandlerInitialized = window.avatarHandlerInitialized || false;

document.addEventListener('DOMContentLoaded', function() {
    console.log("头像处理脚本已加载");
    
    // 避免重复初始化
    if (window.avatarHandlerInitialized) {
        console.log("头像处理脚本已初始化，跳过");
        return;
    }
    
    // 确保头像选择器总是在页面上可以找到
    const currentAvatar = document.getElementById("current-avatar");
    const avatarSelector = document.getElementById("avatar-selector");

    if (currentAvatar && avatarSelector) {
        console.log("找到头像选择器元素");
        
        // 确保头像选择器初始状态为隐藏
        avatarSelector.classList.add("hidden");
        
        // 直接绑定点击事件，但使用事件委托方式避免重复绑定
        document.body.addEventListener("click", function(e) {
            // 如果点击的是头像
            if (e.target.id === "current-avatar" || e.target.closest("#current-avatar")) {
                e.preventDefault();
                e.stopPropagation();
                console.log("头像被点击");
                
                // 如果选择器当前是隐藏的，则显示它
                if (avatarSelector.classList.contains("hidden")) {
                    avatarSelector.style.display = "block";
                    avatarSelector.classList.remove("hidden");
                    console.log("显示头像选择器");
                } else {
                    // 如果已经显示，则隐藏它
                    avatarSelector.classList.add("hidden");
                    console.log("隐藏头像选择器");
                }
            } 
            // 如果点击的不是头像也不是选择器内的元素，则隐藏选择器
            else if (!avatarSelector.contains(e.target)) {
                avatarSelector.classList.add("hidden");
            }
        }, false);
    } else {
        console.warn("头像选择器初始化失败，未找到必要的DOM元素:", {
            currentAvatar: !!currentAvatar,
            avatarSelector: !!avatarSelector
        });
    }

    // 处理默认头像选择
    const avatarGrid = document.querySelector(".avatar-grid");
    if (avatarGrid) {
        // 使用事件委托处理所有头像选项的点击事件
        avatarGrid.addEventListener("click", function(e) {
            const option = e.target.closest(".avatar-option");
            if (option) {
                e.preventDefault();
                e.stopPropagation();
                const path = option.getAttribute("data-path");
                console.log("选择了头像:", path);
                handleAvatarSelection(option);
            }
        });
    } else {
        console.warn("未找到头像网格元素");
    }

    // 处理自定义头像上传
    const fileInputs = document.querySelectorAll('input[type="file"][name="avatar"]');
    fileInputs.forEach(input => {
        // 重新绑定change事件
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('change', function(e) {
            e.stopPropagation();
            console.log("选择了文件上传");
            // 检查文件类型
            const file = this.files[0];
            if (file) {
                // 检查是否是图片类型
                if (!file.type.match('image.*')) {
                    alert('请选择图片文件');
                    this.value = '';
                    return;
                }
                
                // 检查文件大小
                if (file.size > 5 * 1024 * 1024) { // 5MB
                    alert('文件过大，请选择小于5MB的图片');
                    this.value = '';
                    return;
                }
                
                // 显示上传中的提示
                showUploadingIndicator();
                
                // 提交表单
                const form = this.closest('form');
                if (form) {
                    // 确保表单有CSRF令牌
                    const csrfToken = getCsrfToken();
                    let csrfInput = form.querySelector('input[name="csrfmiddlewaretoken"]');
                    if (!csrfInput && csrfToken) {
                        csrfInput = document.createElement('input');
                        csrfInput.type = 'hidden';
                        csrfInput.name = 'csrfmiddlewaretoken';
                        csrfInput.value = csrfToken;
                        form.appendChild(csrfInput);
                    }
                    
                    // 提交表单
                    form.submit();
                }
            }
        });
    });

    // 处理头像选择
    function handleAvatarSelection(option) {
        const avatarPath = option.getAttribute("data-path");
        console.log("处理头像选择:", avatarPath);
        
        if (!avatarPath) {
            console.error("未找到头像路径");
            return;
        }
        
        // 更新所有头像元素
        const allAvatarImages = document.querySelectorAll('.avatar-circle');
        allAvatarImages.forEach(img => {
            img.src = "/media/" + avatarPath;
        });

        // 获取CSRF令牌
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            console.error("未找到CSRF令牌");
            alert("CSRF令牌缺失，无法更新头像。请刷新页面后再试。");
            return;
        }

        // 显示上传中的状态
        showUploadingIndicator();

        // 发送AJAX请求保存选择
        console.log("发送头像更新请求");
        fetch("/homepage/select_default_avatar/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": csrfToken
            },
            body: "avatar_path=" + encodeURIComponent(avatarPath) + "&csrfmiddlewaretoken=" + encodeURIComponent(csrfToken)
        }).then(response => {
            if (response.ok) {
                console.log("头像更新成功");
                hideUploadingIndicator(true);
                
                // 尝试刷新当前页面上所有头像
                document.querySelectorAll('.avatar-circle').forEach(img => {
                    if(img.src.indexOf(avatarPath) === -1) {
                        img.src = "/media/" + avatarPath;
                    }
                });
                
                // 关闭选择器
                if (avatarSelector) {
                    avatarSelector.classList.add("hidden");
                }
                
                return response.json().catch(() => {
                    // 如果无法解析JSON，返回一个默认对象
                    return { success: true };
                });
            } else {
                throw new Error("服务器响应错误: " + response.status);
            }
        }).catch(error => {
            console.error("头像更新请求出错:", error);
            hideUploadingIndicator(false);
            alert("更新头像失败，请重试: " + error.message);
        });
    }

    // 获取CSRF令牌 - 尝试多种方式获取
    function getCsrfToken() {
        // 从cookie中获取
        let csrfToken = null;
        
        // 方法1: 解析cookie
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                csrfToken = cookie.substring('csrftoken='.length);
                break;
            }
        }
        
        // 方法2: 从表单中获取
        if (!csrfToken) {
            const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                csrfToken = csrfInput.value;
            }
        }
        
        // 方法3: 从meta标签获取
        if (!csrfToken) {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            if (csrfMeta) {
                csrfToken = csrfMeta.getAttribute('content');
            }
        }
        
        // 方法4: 从头像表单中获取
        if (!csrfToken && avatarSelector) {
            const avatarForm = avatarSelector.querySelector('form');
            if (avatarForm) {
                const formCsrfInput = avatarForm.querySelector('input[name="csrfmiddlewaretoken"]');
                if (formCsrfInput) {
                    csrfToken = formCsrfInput.value;
                }
            }
        }
        
        console.log("CSRF令牌:", csrfToken ? "已找到" : "未找到");
        return csrfToken;
    }

    // 显示上传中的提示
    function showUploadingIndicator() {
        // 移除任何现有的指示器
        const existingIndicator = document.getElementById('avatar-uploading-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // 创建上传中的指示器
        const indicator = document.createElement('div');
        indicator.id = 'avatar-uploading-indicator';
        indicator.innerHTML = '头像上传中...';
        
        document.body.appendChild(indicator);
    }

    // 隐藏上传中的提示
    function hideUploadingIndicator(success = true) {
        const indicator = document.getElementById('avatar-uploading-indicator');
        if (indicator) {
            indicator.innerHTML = success ? '头像更新成功！' : '头像更新失败！';
            
            // 延时移除
            setTimeout(() => {
                indicator.classList.add('fade-out');
                setTimeout(() => {
                    indicator.remove();
                }, 500);
            }, 1500);
        }
    }
    
    // 确保所有页面的头像显示正确的默认头像
    function ensureDefaultAvatars() {
        // 检查所有头像元素
        const allAvatarImages = document.querySelectorAll('.avatar-circle');
        allAvatarImages.forEach(img => {
            // 如果图片加载失败或没有src
            img.onerror = function() {
                console.log("头像加载失败，应用默认头像");
                this.src = '/media/default_avatars/1.jpg';
            };
            
            // 如果没有src属性或src为空
            if (!img.src || img.src === '' || img.src === 'null' || img.src === 'undefined') {
                console.log("头像src为空，应用默认头像");
                img.src = '/media/default_avatars/1.jpg';
            }
        });
    }
    
    // 确保头像选择器显示所有默认头像选项
    function ensureAvatarOptions() {
        const avatarGrid = document.querySelector(".avatar-grid");
        if (avatarGrid && avatarGrid.children.length === 0) {
            console.log("自动生成默认头像选项");
            // 如果没有头像选项，自动生成1-10的默认头像
            for (let i = 1; i <= 10; i++) {
                const option = document.createElement('img');
                option.src = `/media/default_avatars/${i}.jpg`;
                option.className = "avatar-option hover-scale";
                option.setAttribute("data-path", `default_avatars/${i}.jpg`);
                option.onerror = function() {
                    this.style.display = 'none'; // 如果图片加载失败则隐藏
                };
                avatarGrid.appendChild(option);
            }
        }
    }
    
    // 页面加载完成后执行一系列初始化
    setTimeout(function() {
        ensureDefaultAvatars();
        ensureAvatarOptions();
    }, 100);
    
    // 标记为已初始化
    window.avatarHandlerInitialized = true;
});

// 添加一个全局强制初始化函数
window.forceInitializeAvatar = function() {
    // 重置初始化标志，允许重新初始化
    window.avatarHandlerInitialized = false;
    
    // 触发一次DOMContentLoaded事件处理函数
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    console.log("头像选择器已强制重新初始化");
};

// 确保页面完全加载后执行强制初始化
window.addEventListener('load', function() {
    // 延迟100ms执行，确保DOM已完全准备好
    setTimeout(function() {
        // 检查头像选择器是否应该被初始化
        const currentAvatar = document.getElementById("current-avatar");
        const avatarSelector = document.getElementById("avatar-selector");
        
        if (currentAvatar && avatarSelector && !window.avatarHandlerInitialized) {
            console.log("页面加载完成，强制初始化头像选择器");
            window.forceInitializeAvatar();
        }
    }, 100);
}); 