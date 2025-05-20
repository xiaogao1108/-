from django.db import models
from users.models import User

class Post(models.Model):
    title = models.CharField(max_length=200, verbose_name="标题")
    content = models.TextField(verbose_name="内容")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="作者")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    image = models.URLField(max_length=500, null=True, blank=True, verbose_name="图片链接")
    likes_count = models.IntegerField(default=0, verbose_name="点赞数")
    liked_users = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE, verbose_name="帖子")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="作者")
    content = models.TextField(verbose_name="评论内容")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    def __str__(self):
        return f"Comment by {self.author} on {self.post}"

    class Meta:
        ordering = ['-created_at']  # 评论按创建时间倒序显示

class SensitiveWord(models.Model):
    """敏感词模型"""
    word = models.CharField(max_length=50, unique=True, verbose_name='敏感词')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    def __str__(self):
        return self.word
    
    class Meta:
        verbose_name = '敏感词'
        verbose_name_plural = '敏感词列表'


class UserViolationRecord(models.Model):
    """用户违规记录模型"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='violation_records', verbose_name='用户')
    sensitive_word = models.ForeignKey(SensitiveWord, on_delete=models.CASCADE, verbose_name='敏感词')
    original_content = models.TextField(verbose_name='原始内容')
    filtered_content = models.TextField(verbose_name='过滤后内容')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    violation_type = models.CharField(max_length=20, default='post', choices=[
        ('post', '帖子'), 
        ('comment', '评论')
    ], verbose_name='违规类型')
    
    def __str__(self):
        return f"{self.user.username} - {self.sensitive_word.word}"
    
    class Meta:
        verbose_name = '用户违规记录'
        verbose_name_plural = '用户违规记录'
        
        
# 扩展User模型添加is_banned字段
User.add_to_class('is_banned', models.BooleanField(default=False, verbose_name='是否被封禁'))