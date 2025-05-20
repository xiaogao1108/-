from django.contrib import admin
from .models import Post, Comment, SensitiveWord, UserViolationRecord
from users.models import User

admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(SensitiveWord)

@admin.register(UserViolationRecord)
class UserViolationRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'sensitive_word', 'violation_type', 'created_at')
    list_filter = ('violation_type', 'created_at')
    search_fields = ('user__username', 'sensitive_word__word', 'original_content')
    
# 自定义User管理界面，添加解封功能
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active', 'is_banned')
    list_filter = ('is_active', 'is_staff', 'is_banned')
    search_fields = ('username', 'email', 'nickname')
    actions = ['unban_users']
    
    def unban_users(self, request, queryset):
        queryset.update(is_banned=False)
        self.message_user(request, f"已成功解封 {queryset.count()} 名用户")
    unban_users.short_description = "解封选中的用户"

# 解注册默认的User管理
admin.site.unregister(User)
# 重新注册自定义User管理
admin.site.register(User, CustomUserAdmin)


