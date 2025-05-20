$(document).ready(function() {
  // 页面加载完成后隐藏加载器
  setTimeout(function() {
    $('.page-loader').addClass('loaded');
  }, 500);

  // 滚动进度条
  $(window).scroll(function() {
    var scrollTop = $(window).scrollTop();
    var docHeight = $(document).height();
    var winHeight = $(window).height();
    var scrollPercent = (scrollTop) / (docHeight - winHeight);
    var scrollPercentRounded = Math.round(scrollPercent * 100);
    $('.scroll-progress').css('width', scrollPercentRounded + '%');

    // 回到顶部按钮显示/隐藏
    if (scrollTop > 300) {
      $('.scroll-to-top').addClass('visible');
    } else {
      $('.scroll-to-top').removeClass('visible');
    }
  });

  // 回到顶部按钮点击事件
  $('.scroll-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 500);
  });

  // 显示上传课件弹窗
  $('#show-upload-form').click(function(e) {
    e.preventDefault();
    $('#upload-form-overlay').css('display', 'flex');
  });

  // 关闭上传课件弹窗
  $('#close-upload-form, #cancel-upload').click(function() {
    $('#upload-form-overlay').hide();
    resetFileUpload();
  });

  // 关闭支付弹窗
  $('#close-payment, #cancel-payment').click(function() {
    $('#payment-overlay').hide();
  });

  // 文件上传区域点击触发文件选择
  $('#fileUploadBlock').click(function() {
    $('#id_file').click();
  });

  // 文件拖拽上传
  const fileUploadBlock = document.getElementById('fileUploadBlock');
  if (fileUploadBlock) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileUploadBlock.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      fileUploadBlock.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileUploadBlock.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      fileUploadBlock.classList.add('highlighted');
    }

    function unhighlight() {
      fileUploadBlock.classList.remove('highlighted');
    }

    fileUploadBlock.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      $('#id_file')[0].files = files;
      handleFiles(files);
    }
  }

  // 文件选择处理
  $('#id_file').change(function() {
    const files = this.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  });

  // 处理文件函数
  function handleFiles(files) {
    const file = files[0]; // 只处理第一个文件
    if (file) {
      // 检查文件类型
      const validTypes = ['.doc', '.docx', '.pdf', '.md', '.jpg', '.jpeg', '.png'];
      const fileName = file.name.toLowerCase();
      const fileExt = '.' + fileName.split('.').pop();
      
      if (validTypes.includes(fileExt)) {
        // 显示文件预览
        showFilePreview(file);
      } else {
        alert('不支持的文件类型。请上传 .doc、.pdf、.md、.jpg、.png 等格式的文件。');
        resetFileUpload();
      }
    }
  }

  // 显示文件预览
  function showFilePreview(file) {
    const filePreviewBox = $('#filePreviewBox');
    filePreviewBox.empty();
    
    const fileName = file.name;
    const fileType = fileName.split('.').pop().toLowerCase();
    
    // 创建预览元素
    const previewElement = $('<div class="file-preview"></div>');
    
    // 根据文件类型显示不同的预览
    if (['jpg', 'jpeg', 'png'].includes(fileType)) {
      // 图片文件显示缩略图
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = $('<img>').attr('src', e.target.result);
        previewElement.append(img);
      };
      reader.readAsDataURL(file);
    } else {
      // 其他文件显示图标
      let iconPath = '';
      
      if (fileType === 'pdf') {
        iconPath = '/static/images/pdf-icon.svg';
      } else if (['doc', 'docx'].includes(fileType)) {
        iconPath = '/static/images/doc-icon.svg';
      } else if (fileType === 'md') {
        iconPath = '/static/images/md-icon.svg';
      } else if (['jpg', 'jpeg', 'png'].includes(fileType)) {
        iconPath = '/static/images/img-icon.svg';
      } else {
        iconPath = '/static/images/file-icon.svg';
      }
      
      const img = $('<img>').attr('src', iconPath);
      previewElement.append(img);
    }
    
    // 添加文件名
    const fileNameElement = $('<div class="file-name"></div>').text(fileName);
    
    // 添加删除按钮
    const removeButton = $('<div class="remove-file">&times;</div>');
    removeButton.click(function(e) {
      e.stopPropagation();
      resetFileUpload();
    });
    
    previewElement.append(removeButton);
    filePreviewBox.append(previewElement).append(fileNameElement);
  }

  // 重置文件上传
  function resetFileUpload() {
    $('#id_file').val('');
    $('#filePreviewBox').empty();
  }

  // 下载按钮点击事件
  $('.download-btn').click(function() {
    const materialId = $(this).data('id');
    const price = parseFloat($(this).data('price'));
    const materialTitle = $(this).closest('.material-card').find('.material-title').text();
    
    if (price === 0) {
      // 免费课件，直接下载
      const downloadUrl = `/materials/download/${materialId}/`;
      // 在新窗口打开下载链接
      const downloadWindow = window.open(downloadUrl, '_blank');
      
      // 下载完成后刷新当前页面
      setTimeout(function() {
        location.reload();
      }, 1500);
    } else {
      // 付费课件，显示支付弹窗
      $('#payment-material-title').text(materialTitle);
      $('#payment-amount').text(price.toFixed(2));
      
      // 配置支付环境，使用支付宝沙箱
      setupAlipayPayment(materialId, price);
      
      // 显示支付弹窗
      $('#payment-overlay').css('display', 'flex');
    }
  });

  // 设置支付宝沙箱支付
  function setupAlipayPayment(materialId, amount) {
    // 请求后端生成支付宝订单
    $.ajax({
      url: `/materials/create_payment/${materialId}/`,
      type: 'GET',
      success: function(response) {
        if (response.success) {
          // 显示支付链接和提示
          $('#qrcode-container').html(`
            <div style="text-align:center;">
              <p>请使用支付宝扫描二维码支付</p>
              <p>或</p>
              <a href="${response.pay_url}" target="_blank" class="btn btn-primary hover-lift">
                点击跳转到支付页面
              </a>
            </div>
          `);
          
          // 存储当前支付的订单信息
          $('#qrcode-container').data('material-id', materialId);
          $('#qrcode-container').data('order-id', response.order_id);
          
          // 启动轮询检查支付状态
          startPaymentCheck(response.order_id);
        } else {
          alert('创建订单失败，请重试');
        }
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON ? xhr.responseJSON.error : '创建订单失败，请重试';
        alert(errorMsg);
      }
    });
  }

  // 开始检查支付状态
  let paymentCheckInterval = null;
  function startPaymentCheck(orderId) {
    // 清除之前的检查
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
    }
    
    // 首次立即检查
    checkPaymentStatus(orderId);
    
    // 设置新的检查
    paymentCheckInterval = setInterval(function() {
      checkPaymentStatus(orderId);
    }, 3000); // 每3秒检查一次
    
    // 30秒后停止自动检查
    setTimeout(function() {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
        console.log('停止自动检查支付状态');
      }
    }, 30000);
  }

  // 检查支付状态
  function checkPaymentStatus(orderId) {
    const materialId = $('#qrcode-container').data('material-id');
    
    $.ajax({
      url: `/materials/check_payment/${orderId}/`,
      type: 'GET',
      success: function(response) {
        console.log('支付状态检查结果:', response);
        
        if (response.paid) {
          // 支付成功，停止检查
          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            paymentCheckInterval = null;
          }
          
          // 显示支付成功提示
          $('#payment-overlay').find('.modal-content').html(`
            <h2 class="section-title">✅ 支付成功</h2>
            <div class="section-line"></div>
            <div style="text-align:center; padding: 20px;">
              <p>您的支付已确认，正在准备下载...</p>
            </div>
          `);
          
          // 短暂延迟后跳转到下载页面
          setTimeout(function() {
            // 关闭支付弹窗
            $('#payment-overlay').hide();
            
            // 跳转到下载页面
            const downloadUrl = `/materials/download_paid/${materialId}/`;
            window.location.href = downloadUrl;
            
            // 下载后刷新页面
            setTimeout(function() {
              location.reload();
            }, 2000);
          }, 1500);
        }
      },
      error: function() {
        // 检查失败，继续检查
        console.log('检查支付状态失败');
      }
    });
  }

  // 确认支付按钮点击事件
  $('#confirm-payment').click(function() {
    // 获取订单ID
    const orderId = $('#qrcode-container').data('order-id');
    const materialId = $('#qrcode-container').data('material-id');
    
    if (!orderId || !materialId) {
      alert('订单信息不完整，请刷新页面重试');
      return;
    }
    
    // 显示正在检查支付状态
    $(this).prop('disabled', true);
    $(this).text('正在检查支付状态...');
    
    // 检查支付状态
    $.ajax({
      url: `/materials/check_payment/${orderId}/`,
      type: 'GET',
      success: (response) => {
        if (response.paid) {
          // 支付成功，显示成功提示
          $('#payment-overlay').find('.modal-content').html(`
            <h2 class="section-title">✅ 支付成功</h2>
            <div class="section-line"></div>
            <div style="text-align:center; padding: 20px;">
              <p>您的支付已确认，正在准备下载...</p>
            </div>
          `);
          
          // 短暂延迟后跳转到下载页面
          setTimeout(function() {
            // 关闭支付弹窗
            $('#payment-overlay').hide();
            
            // 跳转到下载页面
            const downloadUrl = `/materials/download_paid/${materialId}/`;
            window.location.href = downloadUrl;
            
            // 下载后刷新页面
            setTimeout(function() {
              location.reload();
            }, 2000);
          }, 1500);
        } else {
          // 支付没有完成
          $(this).prop('disabled', false);
          $(this).text('我已支付');
          alert('您的支付尚未确认，请确保在支付宝中已完成支付。如果已支付，请稍等片刻再点击"我已支付"按钮。');
        }
      },
      error: () => {
        $(this).prop('disabled', false);
        $(this).text('我已支付');
        alert('检查支付状态失败，请刷新页面重试');
      }
    });
  });

  // 搜索功能
  $('#materials-search-btn').click(function() {
    const query = $('#materials-search-input').val().toLowerCase().trim();
    
    if (query === '') {
      // 如果搜索框为空，显示所有课件
      $('.material-card').show();
      return;
    }
    
    // 遍历所有课件卡片，隐藏不匹配的
    $('.material-card').each(function() {
      const title = $(this).find('.material-title').text().toLowerCase();
      const description = $(this).find('.material-text').text().toLowerCase();
      
      if (title.includes(query) || description.includes(query)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
    
    // 如果没有匹配结果，显示提示
    if ($('.material-card:visible').length === 0) {
      if ($('.no-search-results').length === 0) {
        const noResults = $('<div class="no-materials no-search-results">未找到匹配的课件</div>');
        $('.materials-grid').append(noResults);
      }
    } else {
      $('.no-search-results').remove();
    }
  });

  // 搜索框回车触发搜索
  $('#materials-search-input').keypress(function(e) {
    if (e.which === 13) {
      $('#materials-search-btn').click();
    }
  });
}); 