document.addEventListener('DOMContentLoaded', function () {
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

    fetch('/send-email-code/', {
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
        alert("验证码已发送！");
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
        alert(data.message || "发送失败！");
        sendBtn.disabled = false;
        sendBtn.innerText = '获取验证码';
      }
    })
    .catch(() => {
      alert("网络请求失败！");
      sendBtn.disabled = false;
      sendBtn.innerText = '获取验证码';
    });
  });
});
