from django.db import models
from django.conf import settings  # ✅ 改为使用 settings 中的 AUTH_USER_MODEL

class Activity(models.Model):
    title = models.CharField(max_length=100)
    datetime = models.DateTimeField()
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='activity_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # ✅ 替换
    is_club_account = models.BooleanField(default=False, verbose_name="是否为社团账号")  # 添加社团账号字段

    def __str__(self):
        return self.title

    def participant_count(self):
        return self.participants.count()


class Participation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # ✅ 替换
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='participants')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'activity')  # 每人只能参加一次
