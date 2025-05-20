// 校园火榜页面脚本

// 全局变量和函数定义
let submitCommentHandler; // 评论提交处理函数的全局引用

document.addEventListener('DOMContentLoaded', function() {
    console.log("校园火榜页面已加载");
    
    // 页面加载完成后隐藏加载动画
    const pageLoader = document.querySelector('.page-loader');
    if (pageLoader) {
        setTimeout(function() {
            pageLoader.style.opacity = '0';
            setTimeout(function() {
                pageLoader.style.display = 'none';
            }, 500);
        }, 500);
    }

    // 初始化所有类型的帖子卡片，确保它们都使用懒加载
    const allCards = document.querySelectorAll('.forum-post-card, .hot-card, .top-card, .activity-card, .material-card');
    if (allCards.length > 0) {
        console.log(`找到 ${allCards.length} 个卡片需要应用懒加载`);
        
        // 先初始化卡片（隐藏内容）
        allCards.forEach(card => {
            initLazyLoadCard(card);
        });
        
        // 然后在微任务中启动懒加载观察器，确保DOM更新
        setTimeout(() => {
            // 初始化懒加载功能
            initLazyLoad();
            
            // 显示初始视口内的内容
            triggerLazyLoadForVisibleCards();
        }, 100);
    }

    // 标签页切换功能
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.hotlist-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 为当前点击的标签添加active类
            this.classList.add('active');
            
            // 隐藏所有内容区域
            sections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });
            
            // 显示对应的内容区域
            const tabId = this.getAttribute('data-tab');
            const activeSection = document.getElementById(tabId);
            if (activeSection) {
                activeSection.classList.remove('hidden');
                activeSection.classList.add('active');
                
                // 页面切换后重新触发懒加载
                setTimeout(() => {
                    triggerLazyLoadForVisibleCards();
                    
                    // 重置飞入动画
                    const flyInElements = activeSection.querySelectorAll('.fly-in-left, .fly-in-right');
                    flyInElements.forEach(el => {
                        el.classList.remove('visible');
                    });
                    
                    // 重新触发飞入动画检查
                    setTimeout(checkFlyInElements, 50);
                }, 50);
            }
        });
    });

    // 滚动进度条
    const scrollProgress = document.querySelector('.scroll-progress');
    window.addEventListener('scroll', function() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || window.innerHeight;
        const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercentage + '%';
        }
        
        // 回到顶部按钮显示/隐藏
        const scrollToTopBtn = document.querySelector('.scroll-to-top');
        if (scrollToTopBtn) {
            if (scrollTop > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
        
        // 处理飞入动画
        checkFlyInElements();
    });
    
    // 初始化时也检查一次
    setTimeout(checkFlyInElements, 500);

    // 检查并触发飞入动画元素
    function checkFlyInElements() {
        const flyInElements = document.querySelectorAll('.fly-in-left, .fly-in-right');
        flyInElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // 当元素进入视口时添加visible类
            if (rect.top <= windowHeight * 0.9) { // 当元素的顶部进入视口的90%位置时
                el.classList.add('visible');
            }
        });
    }

    // 回到顶部按钮功能
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 头像选择功能
    const currentAvatar = document.getElementById('current-avatar');
    const avatarSelector = document.getElementById('avatar-selector');
    
    if (currentAvatar && avatarSelector) {
        currentAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarSelector.classList.toggle('hidden');
        });
        
        // 点击其他区域关闭头像选择器
        document.addEventListener('click', function(e) {
            if (!avatarSelector.contains(e.target) && e.target !== currentAvatar) {
                avatarSelector.classList.add('hidden');
            }
        });
        
        // 选择默认头像
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.addEventListener('click', function() {
                const path = this.getAttribute('data-path');
                if (path) {
                    // 发送AJAX请求更新头像
                    fetch('/homepage/change_default_avatar/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: `path=${path}&csrfmiddlewaretoken=${getCookie('csrftoken')}`
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            currentAvatar.src = '/media/' + path;
                            avatarSelector.classList.add('hidden');
                        }
                    });
                }
            });
        });
    }
    
    // 论坛帖子点击功能
    const forumPostCards = document.querySelectorAll('.forum-post-card');
    const postModal = document.getElementById('postModal');
    const closePostModal = postModal ? postModal.querySelector('.close-btn') : null;
    
    if (forumPostCards.length > 0 && postModal) {
        forumPostCards.forEach(card => {
            card.style.cursor = 'pointer'; // 添加指针样式，提示可点击
            card.addEventListener('click', function() {
                const postId = this.getAttribute('data-post-id');
                if (postId) {
                    // 获取帖子详情
                    fetch(`/forum/get_post/${postId}/`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok ' + response.statusText);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                const post = data.post;
                                
                                // 填充弹窗内容
                                document.getElementById('modal-post-title').textContent = post.title;
                                document.getElementById('modal-post-content').textContent = post.content;
                                
                                const likesCountElement = document.getElementById('modal-likes-count');
                                const commentsCountElement = document.getElementById('modal-comments-count');
                                const authorNameElement = document.getElementById('modal-author-name');
                                const authorAvatarElement = document.getElementById('modal-author-avatar');
                                const postDateElement = document.getElementById('modal-post-date');
                                
                                if (likesCountElement) likesCountElement.textContent = post.likes_count;
                                if (commentsCountElement) commentsCountElement.textContent = post.comments.length;
                                if (authorNameElement) authorNameElement.textContent = post.author.username;
                                
                                // 设置作者头像
                                let avatarSrc = '/media/default_avatars/1.jpg';
                                if (post.author.avatar) {
                                    avatarSrc = post.author.avatar;
                                } else if (post.author.default_avatar) {
                                    avatarSrc = '/media/' + post.author.default_avatar;
                                }
                                if (authorAvatarElement) authorAvatarElement.src = avatarSrc;
                                
                                // 设置发布日期
                                const date = new Date(post.created_at);
                                if (postDateElement) {
                                    postDateElement.textContent = 
                                        `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                }
                                
                                // 设置帖子图片
                                const modalImage = document.getElementById('modal-post-image');
                                if (post.image) {
                                    modalImage.innerHTML = `<img src="/media/${post.image}" alt="帖子图片">`;
                                    modalImage.style.display = 'block';
                                    
                                    // 添加图片点击放大功能
                                    const img = modalImage.querySelector('img');
                                    const imageZoomOverlay = document.getElementById('imageZoomOverlay');
                                    const zoomedImage = document.getElementById('zoomedImage');
                                    
                                    if (img && imageZoomOverlay && zoomedImage) {
                                        img.addEventListener('click', function() {
                                            zoomedImage.src = this.src;
                                            imageZoomOverlay.style.display = 'flex';
                                        });
                                        
                                        // 关闭放大图片
                                        const zoomCloseBtn = document.querySelector('.zoom-close-btn');
                                        if (zoomCloseBtn) {
                                            zoomCloseBtn.addEventListener('click', function() {
                                                imageZoomOverlay.style.display = 'none';
                                            });
                                        }
                                        
                                        imageZoomOverlay.addEventListener('click', function(e) {
                                            if (e.target === this) {
                                                this.style.display = 'none';
                                            }
                                        });
                                    }
                                } else {
                                    modalImage.innerHTML = '';
                                    modalImage.style.display = 'none';
                                }
                                
                                // 填充评论
                                const commentsList = document.getElementById('modal-comments-list');
                                commentsList.innerHTML = '';
                                
                                if (post.comments && post.comments.length > 0) {
                                    post.comments.forEach(comment => {
                                        let commentAvatarSrc = '/media/default_avatars/1.jpg';
                                        if (comment.author.avatar) {
                                            commentAvatarSrc = comment.author.avatar;
                                        } else if (comment.author.default_avatar) {
                                            commentAvatarSrc = '/media/' + comment.author.default_avatar;
                                        }
                                        
                                        const commentDate = new Date(comment.created_at);
                                        const formattedDate = `${commentDate.getFullYear()}-${String(commentDate.getMonth()+1).padStart(2, '0')}-${String(commentDate.getDate()).padStart(2, '0')} ${String(commentDate.getHours()).padStart(2, '0')}:${String(commentDate.getMinutes()).padStart(2, '0')}`;
                                        
                                        const commentHtml = `
                                            <div class="comment-item" data-post-id="${post.id}">
                                                <div class="comment-header">
                                                    <div class="comment-author">
                                                        <img class="author-avatar" src="${commentAvatarSrc}" alt="用户头像">
                                                        <span>${comment.author.username}</span>
                                                    </div>
                                                    <div class="post-date">${formattedDate}</div>
                                                </div>
                                                <div class="comment-content">${comment.content}</div>
                                            </div>
                                        `;
                                        
                                        commentsList.insertAdjacentHTML('beforeend', commentHtml);
                                    });
                                } else {
                                    commentsList.innerHTML = '<div class="no-comments">暂无评论</div>';
                                }
                                
                                // 显示弹窗
                                postModal.style.display = 'block';
                                document.body.style.overflow = 'hidden'; // 防止背景滚动
                                
                                // 设置点赞按钮状态
                                const likeButton = document.getElementById('like-post-btn');
                                if (likeButton) {
                                    // 先移除旧的点击事件（如果有）
                                    likeButton.onclick = null;
                                    
                                    if (post.is_liked) {
                                        likeButton.textContent = '取消点赞';
                                        likeButton.classList.add('liked');
                                    } else {
                                        likeButton.textContent = '点赞';
                                        likeButton.classList.remove('liked');
                                    }
                                    
                                    // 点赞按钮点击事件
                                    likeButton.onclick = function() {
                                        // 禁用按钮防止重复点击
                                        this.disabled = true;
                                        const originalText = this.textContent;
                                        this.textContent = '处理中...';
                                        
                                        // 修复URL格式，使用正确的后端路由
                                        const currentPostId = post.id;
                                        // 根据服务器路由配置使用正确的URL
                                        const url = `/forum/vote/${currentPostId}/like/`;
                                        
                                        console.log('点赞请求URL:', url);
                                        
                                        fetch(url, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/x-www-form-urlencoded',
                                                'X-CSRFToken': getCookie('csrftoken')
                                            },
                                            body: `csrfmiddlewaretoken=${getCookie('csrftoken')}`
                                        })
                                        .then(response => {
                                            if (!response.ok) {
                                                throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
                                            }
                                            return response.json();
                                        })
                                        .then(data => {
                                            // 恢复按钮状态
                                            this.disabled = false;
                                            
                                            if (data.success) {
                                                // 更新点赞数
                                                if (likesCountElement) {
                                                    likesCountElement.textContent = data.likes_count;
                                                }
                                                
                                                // 更新按钮状态
                                                if (data.is_liked) {
                                                    this.textContent = '取消点赞';
                                                    this.classList.add('liked');
                                                } else {
                                                    this.textContent = '点赞';
                                                    this.classList.remove('liked');
                                                }
                                                
                                                // 更新相应卡片上的点赞数
                                                const cardElement = document.querySelector(`.forum-post-card[data-post-id="${currentPostId}"]`);
                                                if (cardElement) {
                                                    const likesElement = cardElement.querySelector('.likes');
                                                    if (likesElement) {
                                                        likesElement.textContent = `❤️ ${data.likes_count}`;
                                                    }
                                                }
                                            } else {
                                                this.textContent = originalText;
                                                console.error('点赞操作失败:', data.error || '未知错误');
                                                alert(data.error || '点赞操作失败，请重试');
                                            }
                                        })
                                        .catch(error => {
                                            this.disabled = false;
                                            this.textContent = originalText;
                                            console.error('点赞失败:', error);
                                            alert('点赞操作失败: ' + error.message);
                                        });
                                    };
                                }
                                
                                // 添加评论提交功能
                                const submitCommentBtn = document.getElementById('submit-comment');
                                const commentInput = document.getElementById('comment-input');
                                
                                if (submitCommentBtn && commentInput) {
                                    // 重要：清除现有事件监听器，防止重复绑定
                                    if (submitCommentHandler) {
                                        submitCommentBtn.removeEventListener('click', submitCommentHandler);
                                    }
                                    
                                    // 定义评论提交处理函数
                                    submitCommentHandler = function() {
                                        const content = commentInput.value.trim();
                                        if (!content) {
                                            alert('评论内容不能为空');
                                            return;
                                        }
                                        
                                        // 禁用按钮防止重复提交
                                        this.disabled = true;
                                        const originalText = this.textContent;
                                        this.textContent = '提交中...';
                                        
                                        // 保存当前帖子ID，确保评论添加到正确的帖子
                                        const currentPostId = post.id;
                                        console.log('提交评论到帖子:', currentPostId);
                                        
                                        // 确保使用正确的评论提交URL格式
                                        fetch(`/forum/post/${currentPostId}/comment/`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRFToken': getCookie('csrftoken')
                                            },
                                            body: JSON.stringify({ content })
                                        })
                                        .then(response => {
                                            if (!response.ok) {
                                                throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
                                            }
                                            return response.json();
                                        })
                                        .then(data => {
                                            // 恢复按钮状态
                                            this.disabled = false;
                                            this.textContent = originalText;
                                            
                                            if (data.success) {
                                                // 添加新评论到列表
                                                const newComment = data.comment;
                                                const commentHtml = `
                                                    <div class="comment-item" data-post-id="${currentPostId}">
                                                        <div class="comment-header">
                                                            <div class="comment-author">
                                                                <img class="author-avatar" src="${newComment.author_avatar}" alt="用户头像">
                                                                <span>${newComment.author}</span>
                                                            </div>
                                                            <div class="post-date">${newComment.created_at}</div>
                                                        </div>
                                                        <div class="comment-content">${newComment.content}</div>
                                                    </div>
                                                `;
                                                
                                                // 重要：确保评论添加到当前弹出的帖子评论区
                                                const commentsList = document.getElementById('modal-comments-list');
                                                if (commentsList) {
                                                    // 移除"暂无评论"提示
                                                    const noComments = commentsList.querySelector('.no-comments');
                                                    if (noComments) {
                                                        noComments.remove();
                                                    }
                                                    
                                                    // 添加新评论到顶部
                                                    commentsList.insertAdjacentHTML('afterbegin', commentHtml);
                                                    
                                                    // 清空输入框
                                                    commentInput.value = '';
                                                    
                                                    // 更新评论计数
                                                    const commentsCountElement = document.getElementById('modal-comments-count');
                                                    if (commentsCountElement) {
                                                        const commentsCount = parseInt(commentsCountElement.textContent) + 1;
                                                        commentsCountElement.textContent = commentsCount;
                                                    }
                                                }
                                            } else {
                                                alert(data.error || '评论失败');
                                            }
                                        })
                                        .catch(error => {
                                            // 恢复按钮状态
                                            this.disabled = false; 
                                            this.textContent = originalText;
                                            
                                            console.error('提交评论失败:', error);
                                            alert('提交评论失败: ' + error.message);
                                        });
                                    };
                                    
                                    // 添加事件监听器
                                    submitCommentBtn.addEventListener('click', submitCommentHandler);
                                }
                            }
                        })
                        .catch(error => {
                            console.error('获取帖子详情失败:', error);
                            alert('获取帖子详情失败，请重试');
                        });
                }
            });
        });
        
        // 关闭帖子弹窗
        if (closePostModal) {
            closePostModal.addEventListener('click', function() {
                postModal.style.display = 'none';
                document.body.style.overflow = ''; // 恢复背景滚动
            });
            
            // 点击弹窗外部关闭
            postModal.addEventListener('click', function(e) {
                if (e.target === postModal) {
                    postModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
    }
    
    // 活动参加功能和点击查看详情功能
    const activityCards = document.querySelectorAll('#activities .hot-card, #activities .top-card');
    const joinActivityBtns = document.querySelectorAll('.join-activity-btn');
    const imageZoomOverlay = document.getElementById('imageZoomOverlay');
    const zoomedImage = document.getElementById('zoomedImage');
    
    // 为所有活动卡片添加点击事件
    if (activityCards.length > 0) {
        activityCards.forEach(card => {
            card.style.cursor = 'pointer';
            
            card.addEventListener('click', function(e) {
                // 如果点击的是参加按钮，不弹出详情窗口
                if (e.target.closest('.join-activity-btn')) {
                    return;
                }
                
                // 获取活动信息
                const title = this.querySelector('.hot-title, .top-title').textContent;
                const description = this.querySelector('.hot-text, .top-text').textContent;
                const imageSrc = this.querySelector('img').src;
                const dateElement = this.querySelector('.date');
                const locationElement = this.querySelector('.location');
                const participantsElement = this.querySelector('.participants');
                const joinBtn = this.querySelector('.join-activity-btn');
                const activityId = joinBtn ? joinBtn.getAttribute('data-activity-id') : null;
                
                // 创建活动详情弹窗
                const modal = document.createElement('div');
                modal.className = 'overlay';
                modal.style.display = 'block';
                
                modal.innerHTML = `
                    <div class="popup">
                        <span class="close-btn">&times;</span>
                        <div class="modal-content">
                            <h2 class="modal-title">${title}</h2>
                            
                            <div class="modal-meta">
                                ${dateElement ? `<p>📅 ${dateElement.textContent.replace('📅 ', '')}</p>` : ''}
                                ${locationElement ? `<p>📍 ${locationElement.textContent.replace('📍 ', '')}</p>` : ''}
                            </div>
                            
                            <div class="activity-detail-section">
                                <h3>活动详情</h3>
                                <div class="modal-image">
                                    <img src="${imageSrc}" alt="活动图片">
                                </div>
                                <div class="modal-body">${description}</div>
                                <div style="clear: both;"></div>
                            </div>
                            
                            <div class="modal-footer">
                                <div class="participants-count">
                                    已报名：${participantsElement ? participantsElement.textContent.replace('已报名：', '').replace(' 人', '') : '0'} 人
                                </div>
                                ${joinBtn ? `<button class="join-activity-btn modal-join-btn ${joinBtn.classList.contains('btn-success') ? 'btn-success' : 'btn-primary'}" data-activity-id="${activityId}" data-joined="${joinBtn.getAttribute('data-joined')}">${joinBtn.textContent}</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                document.body.style.overflow = 'hidden'; // 防止背景滚动
                
                // 关闭弹窗
                const closeBtn = modal.querySelector('.close-btn');
                closeBtn.addEventListener('click', function() {
                    document.body.removeChild(modal);
                    document.body.style.overflow = ''; // 恢复背景滚动
                });
                
                // 点击弹窗外部关闭
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                        document.body.style.overflow = '';
                    }
                });
                
                // 弹窗中的图片点击放大
                const modalImage = modal.querySelector('.modal-image img');
                if (modalImage) {
                    modalImage.addEventListener('click', function() {
                        if (imageZoomOverlay && zoomedImage) {
                            zoomedImage.src = this.src;
                            imageZoomOverlay.style.display = 'flex';
                        } else {
                            // 如果页面中没有放大图片遮罩，则创建一个
                            const newZoomOverlay = document.createElement('div');
                            newZoomOverlay.className = 'image-zoom-overlay';
                            newZoomOverlay.style.display = 'flex';
                            
                            newZoomOverlay.innerHTML = `
                                <span class="zoom-close-btn">&times;</span>
                                <img class="zoomed-image" src="${this.src}" alt="放大图片">
                            `;
                            
                            document.body.appendChild(newZoomOverlay);
                            
                            // 关闭图片放大
                            const newZoomCloseBtn = newZoomOverlay.querySelector('.zoom-close-btn');
                            newZoomCloseBtn.addEventListener('click', function() {
                                document.body.removeChild(newZoomOverlay);
                            });
                            
                            // 点击背景关闭
                            newZoomOverlay.addEventListener('click', function(e) {
                                if (e.target === this) {
                                    document.body.removeChild(newZoomOverlay);
                                }
                            });
                        }
                    });
                }
                
                // 弹窗中的参加活动按钮
                const modalJoinBtn = modal.querySelector('.modal-join-btn');
                if (modalJoinBtn && activityId) {
                    modalJoinBtn.addEventListener('click', function() {
                        const isJoined = this.getAttribute('data-joined') === 'true';
                        
                        this.disabled = true;
                        const originalText = this.textContent;
                        this.textContent = '处理中...';
                        
                        fetch(`/activities/join/${activityId}/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: `csrfmiddlewaretoken=${getCookie('csrftoken')}`
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                // 更新弹窗按钮状态
                                const joined = data.joined;
                                this.textContent = joined ? '已选' : '我想参加';
                                this.classList.toggle('btn-success', joined);
                                this.classList.toggle('btn-primary', !joined);
                                this.setAttribute('data-joined', joined ? 'true' : 'false');
                                
                                // 同时更新卡片按钮状态
                                const cardBtn = document.querySelector(`.join-activity-btn[data-activity-id="${activityId}"]`);
                                if (cardBtn) {
                                    cardBtn.textContent = joined ? '已选' : '我想参加';
                                    cardBtn.classList.toggle('btn-success', joined);
                                    cardBtn.classList.toggle('btn-primary', !joined);
                                    cardBtn.setAttribute('data-joined', joined ? 'true' : 'false');
                                }
                                
                                // 更新参与人数
                                const modalParticipants = modal.querySelector('.participants-count');
                                if (modalParticipants) {
                                    modalParticipants.textContent = `已报名：${data.participants_count} 人`;
                                }
                                
                                // 更新卡片参与人数
                                const cardParticipants = document.querySelector(`.participants[data-activity-id="${activityId}"]`);
                                if (cardParticipants) {
                                    cardParticipants.textContent = `已报名：${data.participants_count} 人`;
                                }
                            } else {
                                this.textContent = originalText;
                                alert(data.message || '操作失败，请重试');
                            }
                            this.disabled = false;
                        })
                        .catch(error => {
                            console.error('参加活动请求失败:', error);
                            this.textContent = originalText;
                            this.disabled = false;
                            alert('网络错误，请重试');
                        });
                    });
                }
            });
        });
    }
    
    // 活动卡片上的参加按钮
    if (joinActivityBtns.length > 0) {
        joinActivityBtns.forEach(btn => {
            // 从data-joined属性或localStorage中获取参与状态
            const activityId = btn.getAttribute('data-activity-id');
            let isJoined = btn.getAttribute('data-joined') === 'true';
            
            // 根据后端传来的data-joined初始化按钮状态
            btn.classList.toggle('btn-success', isJoined);
            btn.classList.toggle('btn-primary', !isJoined);
            
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡到卡片
                
                if (this.disabled) return;
                
                this.disabled = true;
                const originalText = this.textContent;
                this.textContent = '处理中...';
                
                fetch(`/activities/join/${activityId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: `csrfmiddlewaretoken=${getCookie('csrftoken')}`
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // 更新按钮状态
                        const joined = data.joined;
                        this.textContent = joined ? '已选' : '我想参加';
                        this.classList.toggle('btn-success', joined);
                        this.classList.toggle('btn-primary', !joined);
                        this.setAttribute('data-joined', joined ? 'true' : 'false');
                        
                        // 保存状态到localStorage
                        try {
                            if (joined) {
                                localStorage.setItem(`activity_joined_${activityId}`, 'true');
                            } else {
                                localStorage.removeItem(`activity_joined_${activityId}`);
                            }
                        } catch (e) {
                            console.warn("无法保存到localStorage", e);
                        }
                        
                        // 更新参与人数
                        const participantsElement = document.querySelector(`.participants[data-activity-id="${activityId}"]`);
                        if (participantsElement) {
                            participantsElement.textContent = `已报名：${data.participants_count} 人`;
                        }
                    } else {
                        this.textContent = originalText;
                        alert(data.message || '操作失败，请重试');
                    }
                    this.disabled = false;
                })
                .catch(error => {
                    console.error('参加活动请求失败:', error);
                    this.textContent = originalText;
                    this.disabled = false;
                    alert('网络错误，请重试');
                });
            });
        });
    }
    
    // 图片放大查看
    if (imageZoomOverlay) {
        const zoomCloseBtn = imageZoomOverlay.querySelector('.zoom-close-btn');
        if (zoomCloseBtn) {
            zoomCloseBtn.addEventListener('click', function() {
                imageZoomOverlay.style.display = 'none';
            });
        }
        
        imageZoomOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }

    // 获取CSRF Token的辅助函数
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // 初始化懒加载功能
    function initLazyLoad() {
        // 如果已经创建了观察器，则不重复创建
        if (window.lazyLoadObserver) {
            window.lazyLoadObserver.disconnect();
        }
        
        // 创建IntersectionObserver实例
        window.lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // 当元素进入视口
                if (entry.isIntersecting) {
                    const card = entry.target;
                    
                    // 显示卡片内容
                    card.style.display = 'flex';  // 恢复显示
                    card.style.visibility = 'visible';
                    
                    // 延迟加载图片
                    const lazyImages = card.querySelectorAll('img[data-src]');
                    if (lazyImages.length > 0) {
                        lazyImages.forEach(img => {
                            const dataSrc = img.getAttribute('data-src');
                            if (dataSrc) {
                                img.src = dataSrc;
                                img.removeAttribute('data-src');
                            }
                        });
                    }
                    
                    // 标记已加载
                    card.setAttribute('data-lazy-loaded', 'true');
                    
                    // 加载后停止观察该元素
                    observer.unobserve(card);
                }
            });
        }, {
            root: null, // 使用视口作为根元素
            rootMargin: '100px', // 在元素进入视口前100px开始加载
            threshold: 0.1 // 当元素有10%进入视口时触发
        });
        
        // 处理所有卡片
        document.querySelectorAll('.forum-post-card, .hot-card, .top-card, .activity-card, .material-card').forEach(card => {
            // 只处理未加载过的卡片
            if (!card.hasAttribute('data-lazy-loaded')) {
                // 确保卡片已初始化懒加载
                if (!card.hasAttribute('data-lazy-initialized')) {
                    initLazyLoadCard(card);
                }
                
                // 观察卡片
                window.lazyLoadObserver.observe(card);
            }
        });
    }
    
    // 为卡片初始化懒加载状态
    function initLazyLoadCard(card) {
        // 避免重复初始化
        if (card.hasAttribute('data-lazy-initialized')) {
            return;
        }
        
        // 标记卡片已初始化
        card.setAttribute('data-lazy-initialized', 'true');
        
        // 重要: 初始时完全隐藏卡片
        card.style.display = 'none';
        card.style.visibility = 'hidden';
        
        // 处理卡片中的所有图片
        const images = card.querySelectorAll('img');
        images.forEach(img => {
            if (img.src) {
                // 保存原始图片URL但不加载
                img.setAttribute('data-src', img.src);
                img.removeAttribute('src'); // 完全移除src属性避免加载
            }
        });
    }

    // 触发当前视口内卡片的懒加载
    function triggerLazyLoadForVisibleCards() {
        // 获取当前视口的位置和尺寸
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const buffer = 100; // 额外的缓冲区

        // 检查所有初始化但未加载的卡片
        document.querySelectorAll('[data-lazy-initialized]:not([data-lazy-loaded])').forEach(card => {
            // 获取卡片位置
            const rect = card.getBoundingClientRect();
            const cardTop = rect.top + window.scrollY;
            const cardBottom = cardTop + rect.height;

            // 判断卡片是否在可视区域内
            if ((cardTop >= viewportTop - buffer && cardTop <= viewportBottom + buffer) ||
                (cardBottom >= viewportTop - buffer && cardBottom <= viewportBottom + buffer) ||
                (cardTop <= viewportTop && cardBottom >= viewportBottom)) {
                
                // 显示卡片
                card.style.display = 'flex';
                card.style.visibility = 'visible';

                // 加载图片
                const lazyImages = card.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => {
                    if (img.getAttribute('data-src')) {
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                    }
                });

                // 标记已加载
                card.setAttribute('data-lazy-loaded', 'true');
            }
        });
    }

    // 标签切换时手动触发懒加载
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 延迟一点时间，确保内容已经显示
            setTimeout(function() {
                // 重新初始化懒加载机制
                initLazyLoad();
                
                // 手动触发当前视口内的卡片懒加载
                triggerLazyLoadForVisibleCards();
            }, 100);
        });
    });
}); 

// 添加懒加载相关的CSS
document.addEventListener('DOMContentLoaded', function() {
    // 创建style标签
    const style = document.createElement('style');
    style.textContent = `
        /* 使用原生的loading=lazy属性支持 */
        img[loading="lazy"] {
            display: block;
        }
        
        /* 图片容器保持尺寸以避免布局偏移 */
        .img-container {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
    
    // 确保所有图片都有备用显示
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            if (this.getAttribute('data-original-src')) {
                // 如果加载失败，尝试使用原始源
                this.src = this.getAttribute('data-original-src');
            }
            this.onerror = null; // 防止无限循环
        };
    });
    
    // 监听DOM变化，当有新卡片添加时应用懒加载
    const bodyObserver = new MutationObserver(function(mutations) {
        let newCards = [];
        let needReinit = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType === 1) { // 元素节点
                        // 检查是否添加了新卡片
                        if (node.classList && (
                            node.classList.contains('forum-post-card') || 
                            node.classList.contains('hot-card') || 
                            node.classList.contains('top-card') ||
                            node.classList.contains('activity-card') ||
                            node.classList.contains('material-card')
                        )) {
                            if (!node.hasAttribute('data-lazy-initialized')) {
                                newCards.push(node);
                                needReinit = true;
                            }
                        }
                        
                        // 检查添加的节点内部是否包含卡片
                        const cards = node.querySelectorAll('.forum-post-card, .hot-card, .top-card, .activity-card, .material-card');
                        if (cards.length > 0) {
                            cards.forEach(card => {
                                if (!card.hasAttribute('data-lazy-initialized')) {
                                    newCards.push(card);
                                    needReinit = true;
                                }
                            });
                        }
                    }
                }
            }
        });
        
        // 如果有新卡片添加，应用懒加载
        if (newCards.length > 0) {
            // 首先初始化新卡片
            newCards.forEach(card => {
                initLazyLoadCard(card);
            });
            
            // 然后重新初始化懒加载观察器
            if (needReinit) {
                // 延迟一点时间确保DOM已更新
                setTimeout(initLazyLoad, 50);
            }
        }
    });
    
    // 监听整个body的变化
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 标签切换时重新初始化懒加载
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 延迟一点时间，确保内容已经显示
            setTimeout(function() {
                // 重新初始化懒加载观察器
                initLazyLoad();
            }, 100);
        });
    });
}); 