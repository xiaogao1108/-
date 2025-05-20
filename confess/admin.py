from django.contrib import admin
from .models import Confession, ConfessionVote

@admin.register(Confession)
class ConfessionAdmin(admin.ModelAdmin):
    list_display = ('display_author', 'to_whom', 'likes', 'dislikes', 'created_at')
    search_fields = ('content', 'to_whom')
    list_filter = ('is_anonymous', 'created_at')


@admin.register(ConfessionVote)
class ConfessionVoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'confession', 'is_like')
