from django.contrib import admin
from .models import CampusNews

@admin.register(CampusNews)
class CampusNewsAdmin(admin.ModelAdmin):
    list_display = ('id', 'content_type', 'get_title', 'score', 'updated_at')
    list_filter = ('content_type', 'updated_at')
    search_fields = ('forum_post__title', 'material__title', 'activity__title')
    
    def get_title(self, obj):
        if obj.content_type == 'forum' and obj.forum_post:
            return obj.forum_post.title
        elif obj.content_type == 'material' and obj.material:
            return obj.material.title
        elif obj.content_type == 'activity' and obj.activity:
            return obj.activity.title
        return "未知内容"
    
    get_title.short_description = "标题"
