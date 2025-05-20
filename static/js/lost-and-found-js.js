// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('lost-and-found-js.js loaded');
    
    // 页面加载后的动画
    try {
        setTimeout(function() {
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.classList.add('loaded');
            }
        }, 500);
    } catch (e) {
        console.error('Error in page loader animation:', e);
    }
    
    // 滚动进度条
    window.addEventListener('scroll', function() {
        try {
            const scrollProgress = document.querySelector('.scroll-progress');
            if (scrollProgress) {
                const totalHeight = document.body.scrollHeight - window.innerHeight;
                const progress = (window.scrollY / totalHeight) * 100;
                scrollProgress.style.width = progress + '%';
            }
            
            // 回到顶部按钮
            const scrollToTopBtn = document.querySelector('.scroll-to-top');
            if (scrollToTopBtn) {
                if (window.scrollY > 300) {
                    scrollToTopBtn.classList.add('visible');
                } else {
                    scrollToTopBtn.classList.remove('visible');
                }
            }
        } catch (e) {
            console.error('Error in scroll handler:', e);
        }
    });
    
    // 回到顶部按钮点击事件
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 初始化打字效果
    const typingElements = document.querySelectorAll('.typing-text');
    if (typingElements && typingElements.length) {
        typingElements.forEach(element => {
            if (element) {
                try {
                    const text = element.textContent || '';
                    const speed = parseInt(element.getAttribute('data-speed') || '100');
                    const delay = parseInt(element.getAttribute('data-delay') || '0');
                    
                    element.textContent = '';
                    element.style.display = 'block';
                    
                    setTimeout(() => {
                        let i = 0;
                        function type() {
                            if (i < text.length) {
                                element.textContent += text.charAt(i);
                                i++;
                                setTimeout(type, speed);
                            }
                        }
                        type();
                    }, delay);
                } catch (e) {
                    console.error('Error in typing animation:', e);
                }
            }
        });
    }
    
    // 为所有关闭按钮添加点击事件
    const closeModalButtons = document.querySelectorAll('.close-modal');
    if (closeModalButtons && closeModalButtons.length) {
        closeModalButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                try {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                } catch (e) {
                    console.error('Error closing modal:', e);
                }
            });
        });
    }
    
    // 点击模态窗口外部关闭
    const modals = document.querySelectorAll('.modal');
    if (modals && modals.length) {
        modals.forEach(function(modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    try {
                        this.style.display = 'none';
                    } catch (e) {
                        console.error('Error closing modal on outside click:', e);
                    }
                }
            });
        });
    }
    
    // 聊天框关闭按钮
    const closeChat = document.getElementById('close-chat');
    if (closeChat) {
        closeChat.addEventListener('click', function() {
            try {
                const chatModal = document.getElementById('chat-modal');
                if (chatModal) {
                    chatModal.style.display = 'none';
                }
            } catch (e) {
                console.error('Error closing chat modal:', e);
            }
        });
    }
    
    // 切换失物和招领列表显示
    const showLostBtn = document.getElementById('show-lost');
    const showFoundBtn = document.getElementById('show-found');
    const lostList = document.getElementById('lost-list');
    const foundList = document.getElementById('found-list');
    
    if (showLostBtn && showFoundBtn && lostList && foundList) {
        showLostBtn.addEventListener('click', function() {
            try {
                lostList.style.display = 'block';
                foundList.style.display = 'none';
                showLostBtn.classList.add('active');
                showFoundBtn.classList.remove('active');
            } catch (e) {
                console.error('Error switching to lost items:', e);
            }
        });
        
        showFoundBtn.addEventListener('click', function() {
            try {
                lostList.style.display = 'none';
                foundList.style.display = 'block';
                showFoundBtn.classList.add('active');
                showLostBtn.classList.remove('active');
            } catch (e) {
                console.error('Error switching to found items:', e);
            }
        });
    }
    
    // 简单淡入动画
    const fadeInElements = document.querySelectorAll('.fade-in, .fade-in-down, .fade-in-up');
    if (fadeInElements && fadeInElements.length) {
        fadeInElements.forEach(function(el) {
            try {
                el.style.opacity = '1';
            } catch (e) {
                console.error('Error in fade animation:', e);
            }
        });
    }
    
    // 失物招领表单 AJAX 提交
    const lostFoundForm = document.getElementById('lost-found-form');
    if (lostFoundForm) {
        lostFoundForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submitted');
            
            try {
                const formData = new FormData(this);
                
                // 获取CSRF令牌
                const csrfTokenElement = document.querySelector('input[name=csrfmiddlewaretoken]');
                if (!csrfTokenElement) {
                    console.error('CSRF token not found');
                    alert('表单提交错误：找不到CSRF令牌');
                    return;
                }
                const csrfToken = csrfTokenElement.value;
                
                fetch('/lostfound/create/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'same-origin'
                })
                .then(response => {
                    // 检查响应是否成功
                    if (!response.ok) {
                        throw new Error(`服务器响应错误: ${response.status}`);
                    }
                    
                    // 检查内容类型是否为 JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        // 如果不是JSON，说明可能是重定向或HTML响应
                        if (response.redirected) {
                            window.location.href = response.url;
                            return null;
                        }
                        // 如果是HTML响应，可能需要刷新页面
                        if (contentType.includes('text/html')) {
                            location.reload();
                            return null;
                        }
                        throw new TypeError("返回内容不是JSON格式");
                    }
                    
                    return response.json();
                })
                .then(data => {
                    if (data === null) {
                        // 已经被处理为重定向或刷新
                        return;
                    }
                    
                    if (data && data.status === 'success') {
                        alert('发布成功！');
                        location.reload();
                    } else {
                        alert('发布失败，请重试。');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('发生错误，请稍后再试。');
                });
            } catch (e) {
                console.error('Error submitting form:', e);
                alert('表单提交过程中出现错误，请重试。');
            }
        });
    }

    // 点击"联系发布者"按钮
    const contactButtons = document.querySelectorAll('.contact-btn');
    if (contactButtons && contactButtons.length) {
        contactButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                try {
                    const userId = this.getAttribute('data-user');
                    if (!userId) {
                        console.error('Missing user ID data attribute');
                        return;
                    }
                    
                    currentChatUserId = userId;
                    const isOwner = this.getAttribute('data-is-owner') === 'true';
                    const username = this.getAttribute('data-username');

                    if (isOwner) {
                        alert("您就是该内容的发布者，不能与自己聊天。");
                        return;
                    }

                    // 打开聊天框
                    const chatModal = document.getElementById('chat-modal');
                    if (chatModal) {
                        chatModal.style.display = 'block';
                        
                        const chatWithUser = document.getElementById('chat-with-user');
                        if (chatWithUser) {
                            chatWithUser.textContent = `与 ${username} 聊天`;
                        }
                        
                        const chatMessages = document.getElementById('chat-messages');
                        if (chatMessages) {
                            chatMessages.innerHTML = '';
                        }
                        
                        initiateLongPolling();  // 启动长轮询
                    }
                } catch (e) {
                    console.error('Error opening chat:', e);
                }
            });
        });
    }

    // 发送消息
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            try {
                const chatInput = document.getElementById('chat-input');
                if (!chatInput) return;
                
                const message = chatInput.value.trim();
                if (!message || !currentChatUserId) return;

                const csrfTokenElement = document.querySelector('input[name=csrfmiddlewaretoken]');
                if (!csrfTokenElement) {
                    console.error('CSRF token not found');
                    return;
                }
                const csrfToken = csrfTokenElement.value;
                
                const formData = new FormData();
                formData.append('user_id', currentChatUserId);
                formData.append('content', message);
                formData.append('csrfmiddlewaretoken', csrfToken);
                
                fetch('/lostfound/send_chat_message/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'same-origin'
                })
                .then(response => {
                    // 检查响应是否成功
                    if (!response.ok) {
                        throw new Error(`服务器响应错误: ${response.status}`);
                    }
                    
                    // 检查内容类型是否为 JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new TypeError("返回内容不是JSON格式");
                    }
                    
                    return response.json();
                })
                .then(data => {
                    if (data && data.status === 'ok') {
                        chatInput.value = '';
                        // 手动更新消息，避免等待长轮询
                        updateChatMessages();
                    } else {
                        console.error('Error sending message: unknown response', data);
                    }
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });
            } catch (e) {
                console.error('Error in send message handler:', e);
            }
        });
    }

    // 回车键发送消息（支持 Shift+Enter 换行）
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                try {
                    e.preventDefault();
                    
                    const sendBtn = document.getElementById('send-btn');
                    if (sendBtn) {
                        sendBtn.click();
                    }
                } catch (e) {
                    console.error('Error handling enter key in chat:', e);
                }
            }
        });
    }
    
    // 从聊天用户列表点击聊天
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('chat-user-btn')) {
            try {
                const userId = e.target.getAttribute('data-id');
                if (!userId) {
                    console.error('Missing user ID in chat user button');
                    return;
                }
                
                currentChatUserId = userId;
                const username = e.target.getAttribute('data-username');

                const chatModal = document.getElementById('chat-modal');
                const chatWithUser = document.getElementById('chat-with-user');
                const chatMessages = document.getElementById('chat-messages');
                const chatUserModal = document.getElementById('chat-user-modal');
                
                if (chatModal) chatModal.style.display = 'block';
                if (chatWithUser) chatWithUser.textContent = `与 ${username} 聊天`;
                if (chatMessages) chatMessages.innerHTML = '';
                if (chatUserModal) chatUserModal.style.display = 'none';
                
                initiateLongPolling();  // 启动长轮询
            } catch (e) {
                console.error('Error in chat user button click handler:', e);
            }
        }
    });
    
    // 发布按钮点击事件
    const postItemBtn = document.getElementById('post-item-btn');
    if (postItemBtn) {
        postItemBtn.addEventListener('click', function() {
            try {
                const modal = document.getElementById('post-modal');
                if (modal) {
                    modal.style.display = 'block';
                }
            } catch (e) {
                console.error('Error showing post modal:', e);
            }
        });
    }
    
    // 聊天选择器按钮点击事件
    const openChatSelector = document.getElementById('open-chat-selector');
    if (openChatSelector) {
        openChatSelector.addEventListener('click', function() {
            try {
                const modal = document.getElementById('chat-user-modal');
                if (modal) {
                    modal.style.display = 'block';
                    
                    // 加载聊天用户列表
                    $.ajax({
                        url: '/lostfound/get_chat_users/',
                        type: 'GET',
                        dataType: 'json',
                        success: function(response) {
                            const chatUsers = document.getElementById('chat-users');
                            if (chatUsers) {
                                chatUsers.innerHTML = '';
                                if (response.length === 0) {
                                    chatUsers.innerHTML = '<li>暂无聊天记录</li>';
                                } else {
                                    response.forEach(user => {
                                        const li = document.createElement('li');
                                        li.innerHTML = `
                                            <button class="chat-user-btn" data-id="${user.id}" data-username="${user.username}">
                                                与 ${user.username} 聊天
                                            </button>
                                        `;
                                        chatUsers.appendChild(li);
                                    });
                                }
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('Error getting chat users:', error);
                            const chatUsers = document.getElementById('chat-users');
                            if (chatUsers) {
                                chatUsers.innerHTML = '<li>获取聊天用户列表失败，请重试</li>';
                            }
                        }
                    });
                }
            } catch (e) {
                console.error('Error showing chat user modal:', e);
            }
        });
    }
});

// 聊天相关变量
let currentChatUserId = null;
let longPollingTimeout = null; // 用于存储长轮询的超时ID

// 更新聊天消息
function updateChatMessages() {
    if (!currentChatUserId) return;
    
    try {
        const msgBox = document.getElementById('chat-messages');
        if (!msgBox) return;
        
        fetch(`/lostfound/get_chat_messages/?user_id=${currentChatUserId}`)
        .then(response => {
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            // 检查内容类型是否为 JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("返回内容不是JSON格式");
            }
            return response.json();
        })
        .then(response => {
            if (!response) {
                console.error('Empty response from chat messages API');
                return;
            }
            
            msgBox.innerHTML = '';

            if (response.messages && response.messages.length) {
                response.messages.forEach(msg => {
                    try {
                        const messageClass = msg.sender === response.currentUser ? 'chat-bubble me' : 'chat-bubble other';
                        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        const messageElement = document.createElement('div');
                        messageElement.className = messageClass;
                        messageElement.setAttribute('data-time', time);
                        messageElement.textContent = msg.content;
                        
                        msgBox.appendChild(messageElement);
                    } catch (e) {
                        console.error('Error creating message element:', e);
                    }
                });

                msgBox.scrollTop = msgBox.scrollHeight;
            }
        })
        .catch(error => {
            console.error('Error fetching chat messages:', error);
        });
    } catch (e) {
        console.error('Error in updateChatMessages:', e);
    }
}

// 长轮询实现
function startLongPolling() {
    if (!currentChatUserId) return;
    
    // 在轮询开始时记录时间戳，用于实现更智能的轮询
    const pollStart = Date.now();
    
    try {
        fetch(`/lostfound/get_chat_messages/?user_id=${currentChatUserId}&_=${pollStart}`, {
            // 使用较长的超时，允许服务器延迟响应（服务器可以等到有新消息时才返回）
            signal: AbortSignal.timeout(25000) // 25秒超时，增加超时时间允许服务器有更长时间处理
        })
        .then(response => {
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            // 检查内容类型是否为 JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("返回内容不是JSON格式");
            }
            
            return response.json();
        })
        .then(response => {
            if (!response) {
                console.error('Empty response from chat messages API in long polling');
                smartRestartPolling(5000); // 5秒后重试
                return;
            }
            
            const msgBox = document.getElementById('chat-messages');
            if (!msgBox) {
                smartRestartPolling(5000);
                return;
            }
            
            msgBox.innerHTML = '';

            if (response.messages && response.messages.length) {
                response.messages.forEach(msg => {
                    try {
                        const messageClass = msg.sender === response.currentUser ? 'chat-bubble me' : 'chat-bubble other';
                        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        const messageElement = document.createElement('div');
                        messageElement.className = messageClass;
                        messageElement.setAttribute('data-time', time);
                        messageElement.textContent = msg.content;
                        
                        msgBox.appendChild(messageElement);
                    } catch (e) {
                        console.error('Error creating message element in long polling:', e);
                    }
                });

                msgBox.scrollTop = msgBox.scrollHeight;
                
                // 如果有新消息，2秒后开始下一轮轮询
                // 增加延迟时间以减少服务器压力
                smartRestartPolling(2000);
            } else {
                // 如果没有新消息，使用自适应延迟
                // 计算本次轮询花费的时间
                const pollDuration = Date.now() - pollStart;
                
                // 如果服务器响应很快（小于100ms），可能是没有新消息，增加轮询间隔
                // 使用更长的基础轮询间隔
                const nextPollDelay = pollDuration < 100 ? 8000 : 5000; // 8秒或5秒
                
                smartRestartPolling(nextPollDelay);
            }
        })
        .catch(error => {
            console.error('Error fetching chat messages in long polling:', error);
            
            // AbortError 表示请求被中止，可能是因为超时
            if (error.name === 'AbortError') {
                console.log('Long polling request timed out, restarting');
                smartRestartPolling(5000); // 5秒延迟重试
            } else {
                // 其他错误，使用更长的延迟
                smartRestartPolling(10000); // 错误后10秒后重试
            }
        });
    } catch (e) {
        console.error('Error in startLongPolling:', e);
        smartRestartPolling(10000);
    }
}

// 智能重启轮询的辅助函数，根据当前用户活跃度调整轮询频率
function smartRestartPolling(baseDelay) {
    if (longPollingTimeout) {
        clearTimeout(longPollingTimeout);
    }
    
    // 只有当用户ID还存在时才继续轮询
    if (currentChatUserId) {
        // 检查聊天框是否可见，如果不可见则延长轮询间隔以节省资源
        const chatModal = document.getElementById('chat-modal');
        const isVisible = chatModal && chatModal.style.display === 'block';
        
        // 如果聊天框不可见，使用更长的轮询间隔
        const delay = isVisible ? baseDelay : Math.max(baseDelay * 3, 15000);
        
        // 最后用户活动时间
        const idleTime = window.lastUserActivity ? (Date.now() - window.lastUserActivity) : 0;
        
        // 用户超过1分钟不活跃，增加轮询间隔
        let finalDelay = delay;
        if (idleTime > 60000 && idleTime <= 180000) {
            // 1-3分钟不活跃：2倍延迟
            finalDelay = Math.max(delay * 2, 10000);
        } else if (idleTime > 180000) {
            // 3分钟以上不活跃：3倍延迟
            finalDelay = Math.max(delay * 3, 15000);
        }
        
        longPollingTimeout = setTimeout(startLongPolling, finalDelay);
    }
}

// 跟踪用户活动时间
window.lastUserActivity = Date.now();
document.addEventListener('mousemove', function() {
    window.lastUserActivity = Date.now();
});
document.addEventListener('keydown', function() {
    window.lastUserActivity = Date.now();
});
document.addEventListener('click', function() {
    window.lastUserActivity = Date.now();
});

// 启动长轮询
function initiateLongPolling() {
    try {
        if (currentChatUserId) {
            // 清除之前的长轮询超时ID（如果有）
            if (longPollingTimeout) {
                clearTimeout(longPollingTimeout);
            }
            // 立即更新一次消息
            updateChatMessages();
            // 然后开始轮询等待新消息
            window.lastUserActivity = Date.now(); // 重置用户活跃时间
            smartRestartPolling(5000); // 初始延迟5秒
        }
    } catch (e) {
        console.error('Error in initiateLongPolling:', e);
    }
}