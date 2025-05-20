from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone
from .models import Confession, ConfessionVote
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.urls import reverse
import os

User = get_user_model()

def confession_list(request):
    query = request.GET.get('q', '')
    confessions = Confession.objects.all()

    if query:
        confessions = confessions.filter(
            Q(content__icontains=query) |
            Q(author_name__icontains=query) |
            Q(to_whom__icontains=query)
        )

    confessions = confessions.annotate(
        like_count=Count('confessionvote', filter=Q(confessionvote__is_like=True)),
        dislike_count=Count('confessionvote', filter=Q(confessionvote__is_like=False))
    ).order_by('-like_count', '-created_at')

    for c in confessions:
        c.likes = c.like_count
        c.dislikes = c.dislike_count
    
    # 获取头像选择器的头像范围
    avatar_count = len([f for f in os.listdir('media/default_avatars') if os.path.isfile(os.path.join('media/default_avatars', f))])
    avatar_range = range(1, avatar_count + 1)

    return render(request, 'confess.html', {
        'confessions': confessions, 
        'query': query,
        'avatar_range': avatar_range
    })


@login_required
def create_confession(request):
    if request.method == 'POST':
        author_name = request.POST.get('author_name', '')
        target = request.POST.get('target', '')
        content = request.POST.get('content', '')
        is_anonymous = request.POST.get('is_anonymous') == 'on'

        Confession.objects.create(
            author=request.user,  # 这里依然是记录表白人的用户（登录的用户）
            author_name=author_name if not is_anonymous else '',  # 如果是匿名，author_name 为空
            to_whom=target,  # 表白对象
            content=content,  # 表白内容
            is_anonymous=is_anonymous,  # 是否匿名
            created_at=timezone.now()  # 发布时间
        )

        return redirect('confess:confess')


@login_required
def vote_confession(request, confession_id, vote_type):
    confession = get_object_or_404(Confession, id=confession_id)

    user = request.user if request.user.is_authenticated else None

    vote, created = ConfessionVote.objects.get_or_create(
        confession=confession,
        user=user,
        defaults={'is_like': vote_type == 'like'}
    )

    if not created:
        if (vote_type == 'like' and not vote.is_like) or (vote_type == 'dislike' and vote.is_like):
            vote.is_like = (vote_type == 'like')
            vote.save()
        else:
            # 如果用户点击了已经点过的按钮，则取消投票
            vote.delete()
            # 更新点赞/点踩计数
            confession.likes = ConfessionVote.objects.filter(confession=confession, is_like=True).count()
            confession.dislikes = ConfessionVote.objects.filter(confession=confession, is_like=False).count()
            confession.save()
            return redirect('confess:confess')

    # 更新点赞/点踩计数
    confession.likes = ConfessionVote.objects.filter(confession=confession, is_like=True).count()
    confession.dislikes = ConfessionVote.objects.filter(confession=confession, is_like=False).count()
    confession.save()

    return redirect('confess:confess')


def search_confessions(request):
    query = request.GET.get('q', '')
    return redirect(f"{reverse('confess:confess')}?q={query}")
