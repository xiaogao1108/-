from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta
class User(AbstractUser):
    nickname = models.CharField(max_length=20, verbose_name="昵称", null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  # 用户上传的头像
    default_avatar = models.CharField(max_length=255, blank=True, null=True)  # 默认头像路径
    student_id = models.CharField(max_length=20, null=True, blank=True, verbose_name="学号")
    phone = models.CharField(max_length=11, null=True, blank=True, verbose_name="手机号")
    reset_token = models.CharField(max_length=100, null=True, blank=True, verbose_name="找回密码用Token")
    is_club_account = models.BooleanField(default=False, verbose_name="是否为社团账号")  # 添加社团账号字段

    def __str__(self):
        return self.username

class EmailVerificationCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=15)

    def __str__(self):
        return f"{self.email} - {self.code}"
