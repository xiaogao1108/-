$(document).ready(function () {
  const posts = [];

  function renderPosts(filter = '') {
    const postContainer = $('#forumPosts');
    postContainer.empty();

    let filtered = posts.filter(post =>
      post.title.includes(filter) || post.content.includes(filter)
    );

    filtered.forEach(post => {
      const postDiv = $(`
        <div class="forum-post ${post.highlight ? 'highlighted' : ''}">
          <h3>${post.title}</h3>
          <p>${post.content}</p>
        </div>
      `);

      if (post.imageURL) {
        const img = $('<img>').attr('src', post.imageURL);
        postDiv.append(img);
      }

      postContainer.append(postDiv);
    });
  }

  // 预览图片
  $('#postImage').on('change', function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $('#imagePreviewBox').html(`<img src="${e.target.result}" alt="预览图" />`);
      };
      reader.readAsDataURL(file);
    }
  });

  // 发帖
  $('#postForm').on('submit', function (e) {
    e.preventDefault();

    const title = $('#postTitle').val();
    const content = $('#postContent').val();
    const highlight = $('#highlightPost').is(':checked');
    const imageInput = $('#postImage')[0];
    const imageFile = imageInput.files[0];

    if (!title || !content) return;

    let imageURL = '';
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imageURL = e.target.result;
        posts.unshift({ title, content, highlight, imageURL });
        renderPosts($('#searchInput').val());
        $('#postForm')[0].reset();
        $('#imagePreviewBox').empty();
      };
      reader.readAsDataURL(imageFile);
    } else {
      posts.unshift({ title, content, highlight, imageURL: '' });
      renderPosts($('#searchInput').val());
      $('#postForm')[0].reset();
      $('#imagePreviewBox').empty();
    }
  });

  // 搜索
  $('#searchInput').on('input', function () {
    const keyword = $(this).val();
    renderPosts(keyword);
  });
});

// 点击图片触发文件上传
$('#uploadImage').on('click', function () {
  $('#postImage').click(); // 隐藏的文件输入框触发点击
});

// 预览图片
$('#postImage').on('change', function () {
  const files = this.files;
  const previewBox = $('#imagePreviewBox');
  previewBox.empty(); // 清空之前的预览图

  if (files.length > 3) {
    alert('最多只能上传 3 张图片');
    this.value = ''; // 清空文件输入
    return;
  }

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = $('<img>', {
        src: e.target.result,
        alt: '预览图',
        class: 'preview-img'
      });
      previewBox.append(img);
    };
    reader.readAsDataURL(file);
  });
});


