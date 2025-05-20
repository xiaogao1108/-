# lostandfound/admin.py
from django.contrib import admin
from .models import LostItem, ChatMessage

# 注册失物招领物品模型
admin.site.register(LostItem)

# 注册聊天消息模型
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'short_content', 'timestamp')
    list_filter = ('sender', 'receiver', 'timestamp')
    search_fields = ('sender__username', 'receiver__username', 'content')
    date_hierarchy = 'timestamp'
    
    def short_content(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    
    short_content.short_description = '消息内容'

admin.site.register(ChatMessage, ChatMessageAdmin)
