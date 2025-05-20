from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from .models import Post, Comment, SensitiveWord, UserViolationRecord
from django.core.files.storage import default_storage
from django.utils import timezone
from uuid import uuid4
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
import json
import os
from campus_platform import settings
from users.models import User
from django.contrib import messages
from .sensitive_filter import SensitiveFilter


def forum(request):
    posts = Post.objects.all().order_by('-created_at').select_related('author')
    keyword = request.GET.get('q', '')

    if keyword:
        posts = posts.filter(
            Q(title__icontains=keyword) |
            Q(content__icontains=keyword)
        )

    # 为每个帖子添加作者头像URL
    for post in posts:
        post.author.avatar_url = post.author.avatar if post.author.avatar else post.author.default_avatar

    return render(request, 'forum.html', {
        'posts': posts,
        'keyword': keyword,
        'MEDIA_URL': settings.MEDIA_URL
    })


@csrf_exempt
@require_POST
@login_required
def create_post(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': '无效的 JSON 格式'}, status=400)

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    image_url = data.get('image_url', '').strip()

    if not title or not content:
        return JsonResponse({'success': False, 'error': '标题和内容不能为空'}, status=400)
    
    # 检查用户是否被封禁
    if SensitiveFilter.check_if_banned(request.user):
        return JsonResponse({'success': False, 'error': '您的账号已被封禁，无法发布内容'}, status=403)

    try:
        # 敏感词过滤 - 标题
        filtered_title, title_has_sensitive, _ = SensitiveFilter.filter_sensitive_words(
            title, request.user, violation_type="post"
        )
        
        # 敏感词过滤 - 内容
        filtered_content, content_has_sensitive, _ = SensitiveFilter.filter_sensitive_words(
            content, request.user, violation_type="post"
        )
        
        # 创建帖子（使用过滤后的内容）
        post = Post.objects.create(
            title=filtered_title,
            content=filtered_content,
            image=image_url.replace(settings.MEDIA_URL, '') if image_url else '',
            author=request.user
        )
        
        # 如果存在敏感词，返回提示信息
        if title_has_sensitive or content_has_sensitive:
            return JsonResponse({
                'success': True, 
                'post_id': post.id,
                'warning': '您的内容包含敏感词，已被自动过滤'
            })
        
        return JsonResponse({'success': True, 'post_id': post.id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def like_post(request, post_id, vote_type=None):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': '未登录'}, status=401)
    
    # 检查用户是否被封禁
    if SensitiveFilter.check_if_banned(request.user):
        return JsonResponse({'success': False, 'error': '您的账号已被封禁，无法点赞'}, status=403)
    
    try:
        post = get_object_or_404(Post, id=post_id)
        user = request.user

        if user in post.liked_users.all():
            post.liked_users.remove(user)
            post.likes_count -= 1
            is_liked = False
        else:
            post.liked_users.add(user)
            post.likes_count += 1
            is_liked = True

        post.save()
        return JsonResponse({
            'success': True, 
            'likes_count': post.likes_count,
            'is_liked': is_liked
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': f'点赞操作失败: {str(e)}'
        }, status=500)


@csrf_exempt
@require_POST
def add_comment(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': '未登录'}, status=401)
    
    # 检查用户是否被封禁
    if SensitiveFilter.check_if_banned(request.user):
        return JsonResponse({'success': False, 'error': '您的账号已被封禁，无法发表评论'}, status=403)

    post = get_object_or_404(Post, id=post_id)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': '无效的 JSON 格式'}, status=400)

    content = data.get('content', '').strip()
    if not content:
        return JsonResponse({'success': False, 'error': '评论内容不能为空'}, status=400)
    
    # 敏感词过滤
    filtered_content, has_sensitive, _ = SensitiveFilter.filter_sensitive_words(
        content, request.user, violation_type="comment"
    )

    comment = Comment.objects.create(
        post=post,
        author=request.user,
        content=filtered_content
    )

    response_data = {
        'success': True,
        'comment': {
            'id': comment.id,
            'author': comment.author.username,
            'author_avatar': comment.author.avatar.url if comment.author.avatar else comment.author.default_avatar,
            'content': comment.content,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M')
        }
    }
    
    # 如果存在敏感词，返回提示信息
    if has_sensitive:
        response_data['warning'] = '您的评论包含敏感词，已被自动过滤'
    
    return JsonResponse(response_data)


@csrf_exempt
@require_POST
def upload_image(request):
    image = request.FILES.get('image')

    if not image:
        return JsonResponse({'success': False, 'error': '未收到图片'}, status=400)

    try:
        ext = os.path.splitext(image.name)[1]
        filename = f"{uuid4().hex}_{timezone.now().strftime('%Y%m%d%H%M%S')}{ext}"
        path = os.path.join('forum_images', filename)

        saved_path = default_storage.save(path, image)
        image_url = os.path.join(settings.MEDIA_URL, saved_path)

        return JsonResponse({'success': True, 'image_url': image_url})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_GET
def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all().order_by('-created_at').select_related('author')

    comments_data = [
        {
            'id': comment.id,
            'author': comment.author.username,
            'author_avatar': comment.author.avatar.url if comment.author.avatar else comment.author.default_avatar,
            'content': comment.content,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M')
        }
        for comment in comments
    ]

    return JsonResponse({
        'success': True,
        'comments': comments_data
    })


@csrf_exempt
@require_GET
def get_post(request, post_id):
    """获取帖子详情的API"""
    try:
        post = Post.objects.get(id=post_id)
        comments = Comment.objects.filter(post=post).order_by('-created_at')
        
        # 构建评论数据
        comments_data = []
        for comment in comments:
            comment_data = {
                'id': comment.id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'author': {
                    'id': comment.author.id,
                    'username': comment.author.username,
                }
            }
            
            if comment.author.avatar:
                comment_data['author']['avatar'] = comment.author.avatar.url
            
            if hasattr(comment.author, 'default_avatar') and comment.author.default_avatar:
                comment_data['author']['default_avatar'] = comment.author.default_avatar
                
            comments_data.append(comment_data)
        
        # 构建帖子数据
        post_data = {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat(),
            'likes_count': post.likes_count,
            'author': {
                'id': post.author.id,
                'username': post.author.username,
            },
            'comments': comments_data
        }
        
        if post.image:
            post_data['image'] = post.image
        
        if post.author.avatar:
            post_data['author']['avatar'] = post.author.avatar.url
            
        if hasattr(post.author, 'default_avatar') and post.author.default_avatar:
            post_data['author']['default_avatar'] = post.author.default_avatar
        
        return JsonResponse({
            'success': True,
            'post': post_data
        })
    except Post.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': '帖子不存在'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@login_required
def view_post(request, post_id):
    """直接查看帖子的页面"""
    try:
        post = get_object_or_404(Post, id=post_id)
        posts = Post.objects.all().order_by('-created_at')
        
        return render(request, 'forum.html', {
            'posts': posts,
            'current_post': post,  # 传递当前帖子
            'MEDIA_URL': settings.MEDIA_URL,
            'view_post_id': post_id  # 用于在页面加载时自动打开帖子
        })
    except Post.DoesNotExist:
        messages.error(request, "该帖子不存在")
        return redirect('forum:forum')