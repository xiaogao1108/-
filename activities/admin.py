from django.contrib import admin
from .models import Activity, Participation

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'datetime', 'location', 'created_by', 'is_club_account')  # 显示 is_club_account
    list_filter = ('is_club_account', 'datetime')  # 可通过社团账号进行过滤

@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity', 'joined_at')
