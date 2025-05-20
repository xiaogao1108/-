document.addEventListener('DOMContentLoaded', function () {
  // ===== 获取验证码部分 =====
  const sendBtn = document.getElementById('send-code-btn');
  const emailInput = document.getElementById('email');

  sendBtn.addEventListener('click', function () {
    const email = emailInput.value.trim();

    if (!email) {
      alert("请输入邮箱后再获取验证码！");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerText = '发送中...';

    fetch('/send_email_code/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
      },
      body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("验证码已发送，请查收邮箱！");
        let timeLeft = 60;
        const interval = setInterval(() => {
          sendBtn.innerText = `${timeLeft}s`;
          timeLeft--;
          if (timeLeft < 0) {
            clearInterval(interval);
            sendBtn.disabled = false;
            sendBtn.innerText = '获取验证码';
          }
        }, 1000);
      } else {
        alert(data.message || "发送失败，请稍后再试！");
        sendBtn.disabled = false;
        sendBtn.innerText = '获取验证码';
      }
    })
    .catch(() => {
      alert("请求失败，请检查网络！");
      sendBtn.disabled = false;
      sendBtn.innerText = '获取验证码';
    });
  });

  // ===== 密码一致性校验部分 =====
  const passwordInput = document.querySelector('input[name="password"]');
  const confirmInput = document.querySelector('input[name="confirm_password"]');
  const warningDiv = document.getElementById('password-warning');  // 页面中需加这个 <div>

  function checkPasswordMatch() {
    const pwd = passwordInput.value;
    const confirmPwd = confirmInput.value;

    if (pwd && confirmPwd && pwd !== confirmPwd) {
      confirmInput.setCustomValidity("两次密码不一致！");
      if (warningDiv) warningDiv.innerText = "两次密码不一致！";
    } else {
      confirmInput.setCustomValidity("");
      if (warningDiv) warningDiv.innerText = "";
    }
  }

  // 绑定实时输入监听
  passwordInput.addEventListener('input', checkPasswordMatch);
  confirmInput.addEventListener('input', checkPasswordMatch);

  // ===== 最后提交表单时再做一次确认（防止绕过）=====
  const form = document.getElementById('register-form');
  form.addEventListener('submit', function (e) {
    if (passwordInput.value !== confirmInput.value) {
      alert("两次密码不一致，请重新输入！");
      e.preventDefault(); // 阻止表单提交
    }
  });
});

function sendCode() {
    const email = document.getElementById("email").value;  // ① 获取邮箱输入框的值

    fetch("/users/send-code/", {                          // ② 向 Django 发请求
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'  // 表单形式传数据
        },
        body: `email=${encodeURIComponent(email)}`               // ③ 构造请求体（键值对）
    })
    .then(response => response.json())                            // ④ 把返回结果转成 JSON
    .then(data => {
        alert(data.message);                                      // ⑤ 弹出提示：验证码已发送/失败原因
    });
}
