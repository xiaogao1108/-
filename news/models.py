from django.db import models
from django.conf import settings
from forum.models import Post
from materials.models import Material
from activities.models import Activity

class CampusNews(models.Model):
    """校园火榜模型，用于展示热门内容"""
    
    CONTENT_TYPE_CHOICES = (
        ('forum', '论坛帖子'),
        ('material', '课件下载'),
        ('activity', '社团活动'),
    )
    
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, verbose_name="内容类型")
    forum_post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, verbose_name="论坛帖子")
    material = models.ForeignKey(Material, on_delete=models.CASCADE, null=True, blank=True, verbose_name="课件")
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, null=True, blank=True, verbose_name="活动")
    score = models.IntegerField(default=0, verbose_name="热度分数")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        ordering = ['-score', '-updated_at']
        verbose_name = "校园火榜"
        verbose_name_plural = "校园火榜"
        
    def __str__(self):
        if self.content_type == 'forum' and self.forum_post:
            return f"论坛: {self.forum_post.title}"
        elif self.content_type == 'material' and self.material:
            return f"课件: {self.material.title}"
        elif self.content_type == 'activity' and self.activity:
            return f"活动: {self.activity.title}"
        return f"未知内容 {self.id}"
