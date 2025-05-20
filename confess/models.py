from django.db import models
from django.conf import settings  # 使用 AUTH_USER_MODEL 兼容自定义用户

class Confession(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="表白人")
    author_name = models.CharField(max_length=50, blank=True, null=True, verbose_name="表白人名字")  # 添加表白人名字字段
    to_whom = models.CharField(max_length=50, verbose_name="表白对象")
    content = models.TextField(verbose_name="表白内容")
    is_anonymous = models.BooleanField(default=False, verbose_name="是否匿名")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="发布时间")
    likes = models.PositiveIntegerField(default=0, verbose_name="点赞数")
    dislikes = models.PositiveIntegerField(default=0, verbose_name="点踩数")

    @property
    def display_author(self):
        return "匿名用户" if self.is_anonymous else self.author_name or self.author.username

    @property
    def liked_users(self):
        return [vote.user for vote in self.confessionvote_set.filter(is_like=True)]
    
    @property
    def disliked_users(self):
        return [vote.user for vote in self.confessionvote_set.filter(is_like=False)]

    def __str__(self):
        return f"{self.display_author} ➡ {self.to_whom}：{self.content[:10]}..."

    class Meta:
        ordering = ['-likes', '-created_at']
        verbose_name = "表白"
        verbose_name_plural = "表白"


class ConfessionVote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="用户")
    confession = models.ForeignKey(Confession, on_delete=models.CASCADE, verbose_name="表白")
    is_like = models.BooleanField(verbose_name="是否点赞")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="投票时间")

    class Meta:
        unique_together = ('user', 'confession')
        verbose_name = "表白投票"
        verbose_name_plural = "表白投票"
