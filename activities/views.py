from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Activity, Participation
from .forms import ActivityForm
from django.views.decorators.http import require_POST
import json
from django.db.models import Count

@login_required
def activities(request):
    activities_list = Activity.objects.all().order_by('-created_at')
    for activity in activities_list:
        activity.has_joined = Participation.objects.filter(user=request.user, activity=activity).exists()
        activity.participant_count = activity.participant_count()
    form = ActivityForm()
    return render(request, 'activities.html', {'activities': activities_list, 'form': form})

@login_required
def create_activity(request):
    if not request.user.is_club_account:
        return JsonResponse({'success': False, 'message': '只有社团专属账号可以上传活动哦～'})

    if request.method == 'POST':
        form = ActivityForm(request.POST, request.FILES)
        if form.is_valid():
            activity = form.save(commit=False)
            activity.created_by = request.user
            activity.save()
            return redirect('activities:activities')
        else:
            # ❗ 表单不合法，回传错误信息 & 已填内容
            activities_list = Activity.objects.all().order_by('-created_at')
            for activity in activities_list:
                activity.has_joined = activity.participants.filter(id=request.user.id).exists()
            return render(request, 'activities.html', {
                'form': form,
                'activities': activities_list
            })
    else:
        return redirect('activities:activities')

@login_required
@require_POST
def join_activity(request, activity_id):
    """参加或取消参加活动的API"""
    try:
        activity = get_object_or_404(Activity, id=activity_id)
        user = request.user
        
        # 检查用户是否已经参加了该活动
        participation = Participation.objects.filter(user=user, activity=activity).first()
        
        if participation:
            # 如果已参加，则取消参加
            participation.delete()
            joined = False
        else:
            # 如果未参加，则参加活动
            Participation.objects.create(user=user, activity=activity)
            joined = True
        
        # 获取最新的参与人数
        participants_count = activity.participants.count()
        
        return JsonResponse({
            'success': True,
            'joined': joined,
            'participants_count': participants_count,
            'status': 'success',
            'message': '操作成功'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
            'status': 'error'
        }, status=500)
