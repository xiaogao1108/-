document.addEventListener('DOMContentLoaded', function () {
    console.log("论坛 JS 已加载");

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
    document.querySelector('.logout').addEventListener('click', function(e) {
        e.preventDefault();
        const confirmed = confirm("确定退出登录吗？");
        if (confirmed) {
            window.location.href = this.href;
        }
    });

    // 处理发布帖子弹窗显示/隐藏
    const showPostFormBtn = document.getElementById('show-post-form');
    const postFormOverlay = document.getElementById('post-form-overlay');
    const postFormPopup = document.getElementById('post-form-popup');
    const closePostFormBtn = document.getElementById('close-post-form');
    const cancelPostBtn = document.getElementById('cancel-post');

    if (showPostFormBtn && postFormOverlay) {
        showPostFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            postFormOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    }

    if (closePostFormBtn && postFormOverlay) {
        closePostFormBtn.addEventListener('click', function() {
            postFormOverlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        });
    }

    if (cancelPostBtn && postFormOverlay) {
        cancelPostBtn.addEventListener('click', function() {
            postFormOverlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        });
    }

    // 点击弹窗外关闭
    postFormOverlay.addEventListener('click', function(e) {
        if (e.target === postFormOverlay) {
            postFormOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    const postForm = document.getElementById('postForm');
    const postButton = document.getElementById('post-button');
    const imageInput = document.getElementById('postImage');
    const uploadBtn = document.getElementById('uploadImage');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    async function uploadImage(imageFile) {
        if (!imageFile) return '';

        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const response = await fetch('/forum/upload-image/', {
                method: 'POST',
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('图片上传失败');
            }

            const data = await response.json();
            return data.image_url || '';
        } catch (error) {
            console.error('图片上传错误:', error);
            return '';
        }
    }

    if (postForm && postButton) {
        uploadBtn.addEventListener('click', function () {
            imageInput.click();
        });

        imageInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const imageUrl = URL.createObjectURL(file);
                const previewBox = document.querySelector('.image-preview-box');

                // 清空预览框并添加新图片
                previewBox.innerHTML = `
                    <div class="preview-image-container">
                        <img src="${imageUrl}" alt="预览图">
                        <span class="close-preview">&times;</span>
                    </div>
                `;

                // 添加关闭预览的事件
                previewBox.querySelector('.close-preview').addEventListener('click', function(e) {
                    e.stopPropagation();
                    previewBox.innerHTML = '';
                    imageInput.value = '';
                });
            }
        });

        postButton.addEventListener('click', async function (e) {
            e.preventDefault();

            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('postContent').value.trim();
            const imageFile = imageInput.files[0];

            if (!title || !content) {
                alert('标题和内容不能为空');
                return;
            }

            // 显示加载中状态
            postButton.disabled = true;
            postButton.textContent = '发布中...';

            try {
                // 先上传图片
                const imageUrl = await uploadImage(imageFile);
                
                // 然后创建帖子
                const postData = {
                    title: title,
                    content: content,
                    image_url: imageUrl
                };
                
                const response = await fetch('/forum/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(postData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 403 && errorData.error.includes('封禁')) {
                        alert(errorData.error); // 显示封禁信息
                        return;
                    }
                    throw new Error(errorData.error || '发布失败');
                }

                const resData = await response.json();

                if (resData.success) {
                    // 如果包含敏感词警告，显示提示
                    if (resData.warning) {
                        alert(resData.warning);
                    }
                
                    // 显示成功消息
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = '发帖成功！页面即将刷新...';
                    postForm.appendChild(successMsg);
                    
                    // 关闭弹窗
                    postFormOverlay.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    
                    // 延迟2秒后刷新页面
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    alert('发帖失败: ' + (resData.error || '未知错误'));
                    postButton.disabled = false;
                    postButton.textContent = '发布帖子';
                }
            } catch (err) {
                console.error('发帖出错:', err);
                alert('发帖出错: ' + err.message);
                postButton.disabled = false;
                postButton.textContent = '发布帖子';
            }
        });
    }

    // 添加点赞功能
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', async function (e) {
            e.stopPropagation();
            e.preventDefault();
            const postId = this.dataset.postId;

            try {
                const response = await fetch(`/forum/post/${postId}/like/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });

                const result = await response.json();
                if (result.success) {
                    if (this.textContent.includes('取消')) {
                        this.textContent = `点赞`;
                    } else {
                        this.textContent = `取消点赞`;
                    }
                    // 更新点赞数显示
                    const likesCountElement = this.closest('.post-card').querySelector('.likes-count');
                    if (likesCountElement) {
                        likesCountElement.textContent = `❤️ ${result.likes_count}`;
                    }
                } else {
                    if (result.error === '未登录') {
                        alert('请登录后再点赞');
                    } else {
                        alert('点赞失败: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('点赞失败:', error);
                alert('点赞失败: ' + error.message);
            }
        });
    });

    // 帖子详情弹窗
    const postCards = document.querySelectorAll('.post-card, .forum-post-card');
    const postModal = document.getElementById('postModal');
    const closeBtn = document.querySelector('#postModal .close-btn');
    const imageModal = document.getElementById('imageModal');
    const closeImageBtn = document.querySelector('.close-image-btn');
    const enlargedImage = document.getElementById('enlargedImage');
    
    // 检查postModal是否存在
    if (!postModal) {
        console.warn('帖子详情模态框不存在，请检查HTML结构');
    }
    
    // 帖子点击弹出详情
    postCards.forEach(card => {
        card.addEventListener('click', function(event) {
            // 如果点击的是点赞按钮，不打开详情
            if (event.target.closest('.like-btn')) {
                return;
            }
            
            try {
                const postId = this.dataset.postId;
                console.log('帖子点击: ID =', postId);
                
                if (!postId) {
                    console.error('找不到帖子ID');
                    return;
                }
                
                // 使用AJAX加载帖子详情并显示模态窗口
                fetch(`/forum/get_post/${postId}/`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('获取帖子失败，状态码: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            const post = data.post;
                            
                            // 填充模态窗口内容
                            document.getElementById('modal-title').textContent = post.title;
                            document.getElementById('modal-content').textContent = post.content;
                            document.getElementById('modal-author').textContent = post.author.username;
                            document.getElementById('modal-date').textContent = new Date(post.created_at).toLocaleString('zh-CN');
                            
                            // 设置用户头像
                            let avatarSrc = '/media/default_avatars/1.jpg'; // 默认头像
                            if (post.author.avatar) {
                                // 检查URL是否已经包含/media/前缀
                                if (post.author.avatar.startsWith('/media/')) {
                                    avatarSrc = post.author.avatar;
                                } else {
                                    avatarSrc = '/media/' + post.author.avatar;
                                }
                            } else if (post.author.default_avatar) {
                                // 检查URL是否已经包含/media/前缀
                                if (post.author.default_avatar.startsWith('/media/')) {
                                    avatarSrc = post.author.default_avatar;
                                } else {
                                    avatarSrc = '/media/' + post.author.default_avatar;
                                }
                            }
                            document.getElementById('modal-avatar').src = avatarSrc;
                            
                            // 设置图片(如果有)
                            const modalImage = document.getElementById('modal-image');
                            if (post.image) {
                                // 检查URL是否已经包含/media/前缀
                                let imageUrl = post.image;
                                if (!post.image.startsWith('/media/') && !post.image.startsWith('http')) {
                                    imageUrl = '/media/' + post.image;
                                }
                                modalImage.src = imageUrl;
                                modalImage.parentElement.style.display = 'block';
                            } else {
                                modalImage.parentElement.style.display = 'none';
                            }
                            
                            // 设置帖子ID，用于评论
                            document.getElementById('post-id').value = postId;
                            
                            // 加载评论
                            loadComments(postId);
                            
                            // 显示模态窗口
                            postModal.style.display = 'flex';
                            document.body.style.overflow = 'hidden'; // 防止背景滚动
                        } else {
                            console.error('获取帖子数据失败:', data.message);
                            alert('获取帖子数据失败: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('获取帖子详情失败:', error);
                        alert('获取帖子详情失败: ' + error.message);
                    });
            } catch (error) {
                console.error('点击帖子处理出错:', error);
                alert('查看帖子详情失败: ' + error.message);
            }
        });
    });
    
    // 关闭帖子详情弹窗
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            postModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        });
    }
    
    // 点击弹窗外关闭
    if (postModal) {
        postModal.addEventListener('click', function(e) {
            if (e.target === postModal) {
                postModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // 关闭图片查看弹窗
    if (closeImageBtn) {
        closeImageBtn.addEventListener('click', function() {
            if (imageModal) {
                imageModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // 点击图片弹窗外关闭
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // 点击帖子中的图片放大显示
    document.addEventListener('click', function(e) {
        // 检查是否点击的是模态窗口中的图片
        if (e.target && e.target.id === 'modal-image' && e.target.src) {
            // 设置大图src和显示图片弹窗
            enlargedImage.src = e.target.src;
            imageModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
    });

    // 评论文本框监听回车键发送评论
    const commentTextarea = document.getElementById('comment-textarea');
    if (commentTextarea) {
        commentTextarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const commentButton = document.getElementById('comment-button');
                if (commentButton) commentButton.click();
            }
        });
    }

    // 评论按钮点击事件
    const commentButton = document.getElementById('comment-button');
    let postId = null;

    if (commentButton && commentTextarea) {
        commentButton.addEventListener('click', async function () {
            const commentText = commentTextarea.value.trim();
            postId = document.getElementById('post-id').value;
            
            if (!commentText) {
                alert('评论内容不能为空');
                return;
            }

            try {
                commentButton.disabled = true;
                commentButton.textContent = '发送中...';

                const response = await fetch(`/forum/post/${postId}/comment/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ content: commentText })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 403 && errorData.error.includes('封禁')) {
                        alert(errorData.error); // 显示封禁信息
                        return;
                    }
                    throw new Error(errorData.error || '评论发送失败');
                }

                const data = await response.json();

                if (data.success) {
                    // 如果包含敏感词警告，显示提示
                    if (data.warning) {
                        alert(data.warning);
                    }
                
                    // 添加新评论到评论区
                    addCommentToDOM(data.comment);
                    
                    // 清空输入框
                    commentTextarea.value = '';
                } else {
                    throw new Error(data.error || '评论发送失败');
                }
            } catch (error) {
                alert(error.message);
            } finally {
                commentButton.disabled = false;
                commentButton.textContent = '发送';
            }
        });
    }

    // 添加评论到DOM
    function addCommentToDOM(comment) {
        const commentsContainer = document.getElementById('comments-container');
        
        if (!commentsContainer) return;
        
        // 处理头像URL，确保正确的格式
        let avatarUrl = '/media/default_avatars/1.jpg'; // 默认头像
        if (comment.author_avatar) {
            // 检查URL是否已经包含/media/前缀
            if (comment.author_avatar.startsWith('/media/')) {
                avatarUrl = comment.author_avatar;
            } else {
                avatarUrl = '/media/' + comment.author_avatar;
            }
        }
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <img src="${avatarUrl}" alt="用户头像" class="comment-avatar">
                    <span>${comment.author}</span>
                </div>
                <span class="comment-date">${comment.created_at}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
        `;
        
        // 添加到列表开头（最新的评论在前）
        commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    }

    // 加载评论
    function loadComments(postId) {
        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer) return;
        
        commentsContainer.innerHTML = '<div class="loading-comments">加载评论中...</div>';
        
        fetch(`/forum/post/${postId}/comments/`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    commentsContainer.innerHTML = '';
                    
                    if (data.comments.length === 0) {
                        commentsContainer.innerHTML = '<div class="no-comments">暂无评论</div>';
                        return;
                    }
                    
                    data.comments.forEach(comment => {
                        // 处理头像URL，确保正确的格式
                        let avatarUrl = '/media/default_avatars/1.jpg'; // 默认头像
                        if (comment.author_avatar) {
                            // 检查URL是否已经包含/media/前缀
                            if (comment.author_avatar.startsWith('/media/')) {
                                avatarUrl = comment.author_avatar;
                            } else {
                                avatarUrl = '/media/' + comment.author_avatar;
                            }
                        }
                        
                        const commentElement = document.createElement('div');
                        commentElement.className = 'comment';
                        commentElement.innerHTML = `
                            <div class="comment-header">
                                <div class="comment-author">
                                    <img src="${avatarUrl}" alt="用户头像" class="comment-avatar">
                                    <span>${comment.author}</span>
                                </div>
                                <span class="comment-date">${comment.created_at}</span>
                            </div>
                            <p class="comment-text">${comment.content}</p>
                        `;
                        commentsContainer.appendChild(commentElement);
                    });
                } else {
                    commentsContainer.innerHTML = '<div class="error-message">加载评论失败</div>';
                }
            })
            .catch(error => {
                console.error('加载评论错误:', error);
                commentsContainer.innerHTML = '<div class="error-message">加载评论失败</div>';
            });
    }

    // 搜索功能实现
    document.getElementById('forum-search-btn').addEventListener('click', function() {
        const keyword = document.getElementById('forum-search-input').value.trim();
        if (keyword === '') {
            window.location.href = '/forum/';
        } else {
            window.location.href = `/forum/?q=${encodeURIComponent(keyword)}`;
        }
    });

    // 回车搜索
    document.getElementById('forum-search-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('forum-search-btn').click();
        }
    });

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

    // 使用浏览器原生懒加载
    // 注意：loading="lazy" 属性已经在HTML标签中添加
    // 这个方法只是为了确保浏览器不支持原生懒加载时的后备方案
    function checkNativeLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            console.log('浏览器支持原生懒加载');
        } else {
            console.log('浏览器不支持原生懒加载，已降级处理');
            // 为不支持原生懒加载的浏览器添加后备方案
            // 在这里可以添加自定义的懒加载实现
        }
    }
    
    // 检查浏览器是否支持原生懒加载
    checkNativeLazyLoading();
});