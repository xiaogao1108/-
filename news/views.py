from django.shortcuts import render
from .models import CampusNews
from forum.models import Post
from materials.models import Material
from activities.models import Activity, Participation
from django.db.models import Count, F, ExpressionWrapper, FloatField
from django.contrib.auth.decorators import login_required

@login_required
def news(request):
    # 获取热门论坛帖子（根据评论数和点赞数排序）
    hot_forum_posts = Post.objects.annotate(
        hot_score=ExpressionWrapper(
            F('likes_count') * 2 + Count('comments'), 
            output_field=FloatField()
        )
    ).order_by('-hot_score')[:10]
    
    # 获取热门课件（根据下载数排序）
    hot_materials = Material.objects.order_by('-download_count')[:10]
    
    # 获取热门活动（根据参与人数排序）
    hot_activities = Activity.objects.annotate(
        participants_count=Count('participants')
    ).order_by('-participants_count')[:10]
    
    # 为每个活动标记用户是否已参加
    if request.user.is_authenticated:
        user_participations = Participation.objects.filter(
            user=request.user,
            activity__in=hot_activities
        ).values_list('activity_id', flat=True)
        
        for activity in hot_activities:
            activity.has_joined = activity.id in user_participations
    
    context = {
        'hot_forum_posts': hot_forum_posts,
        'hot_materials': hot_materials,
        'hot_activities': hot_activities,
        'avatar_range': range(1, 13),  # 为头像选择器提供默认头像范围
    }
    
    return render(request=request, template_name='campusnews.html', context=context)
