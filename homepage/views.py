from django.shortcuts import render

def homepage(request):
    context = {
        "avatar_range": range(1, 13),
    }
    return render(request=request, template_name='homepage.html',context=context)

from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

@login_required
def upload_avatar(request):
    if request.method == 'POST' and request.FILES.get('avatar'):
        request.user.avatar = request.FILES['avatar']
        request.user.save()
    return redirect('homepage:homepage')  # 上传后跳转回首页

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

@login_required
def select_default_avatar(request):
    if request.method == 'POST':
        avatar_path = request.POST.get('avatar_path')  # 例：default_avatars/3.jpg
        if avatar_path:
            user = request.user
            user.avatar = None  # 清除自定义头像
            user.default_avatar = avatar_path
            user.save()
            return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)
