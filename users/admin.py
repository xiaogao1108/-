from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User  # 使用 User 而非 CustomUser

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('first_name', 'last_name', 'email', 'is_club_account')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('last_login', 'date_joined')}),
        ('附加信息', {'fields': ('nickname', 'avatar', 'default_avatar', 'student_id', 'phone', 'reset_token')}),
    )
    
    list_display = ('username', 'email', 'is_club_account', 'is_staff', 'is_active')
    
    list_filter = ('is_club_account', 'is_staff', 'is_superuser', 'is_active')
    
    search_fields = ('username', 'email', 'first_name', 'last_name')
