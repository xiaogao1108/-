from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import get_user_model
import json
import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import EmailVerificationCode
from django.core.mail import send_mail
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
import re

User = get_user_model()

def login(request):
    print(request.method)
    if request.method == 'POST':
        username = request.POST.get('username').strip()
        password = request.POST.get('password').strip()

        if not username:
            messages.error(request, "用户名不能为空")
            return render(request, 'login.html')

        if not password:
            messages.error(request, "密码不能为空")
            return render(request, 'login.html')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            messages.error(request, "用户名不存在")
            return render(request, 'login.html')

            # 再判断密码是否正确
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return redirect('homepage:homepage')  # 替换为你的首页 URL 名称
        else:
            messages.error(request, "密码错误")
            return render(request, 'login.html')

    return render(request=request,template_name='login.html')

def logout_view(request):
    logout(request)
    return redirect('users:login')

def register(request):
    print(request.method)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        email = request.POST.get('email')
        email_code = request.POST.get('email_code')
        
        # 用户名长度和字符验证
        if not re.match(r'^[a-zA-Z0-9]{6,12}$', username):
            messages.error(request, '用户名必须为6-12个数字或字母')
            return render(request, 'register.html')
            
        # 密码长度和字符验证
        if not re.match(r'^[a-zA-Z0-9]{6,12}$', password):
            messages.error(request, '密码必须为6-12个数字或字母')
            return render(request, 'register.html')

        # 校验两次密码
        if password != confirm_password:
            messages.error(request, '两次密码不一致,请重新输入')
            return render(request, 'register.html')

        # 用户名/邮箱重复校验
        if User.objects.filter(username=username).exists():
            messages.error(request, '用户名已存在')
            return render(request, 'register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, '该邮箱已注册')
            return render(request, 'register.html')

        record = EmailVerificationCode.objects.filter(email=email).order_by('-created_at').first()
        if not record:
            messages.error(request, "验证码无效")
            return redirect('users:register')
        if record.code != email_code:
            messages.error(request, "验证码错误")
            return redirect('users:register')
        if record.is_expired():
            messages.error(request, "验证码已过期，请重新获取")
            return redirect('users:register')

        if User.objects.filter(username=username).exists():
            messages.error(request, "用户名已存在")
            return redirect('users:register')

        user = User.objects.create_user(username=username, password=password, email=email)
        user.save()

        # 注册成功后删除验证码记录
        EmailVerificationCode.objects.filter(email=email).delete()

        return redirect('users:register_success')  # 你后面要写的注册成功页

    return render(request, 'register.html')

def generate_code():
    return ''.join(random.choices('0123456789', k=6))

@csrf_exempt
def send_email_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'success': False, 'message': '邮箱不能为空！'})

            # 生成 6 位验证码
            code = ''.join(random.choices('0123456789', k=6))

            # 保存到数据库
            EmailVerificationCode.objects.create(email=email, code=code)

            # 发送邮件
            send_mail(
                subject='【校园综合服务平台】邮箱验证码',
                message=f'您的验证码是：{code}，5分钟内有效。',
                from_email=None,
                recipient_list=[email],
                fail_silently=False,
            )

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'发生错误：{str(e)}'})
    return JsonResponse({'success': False, 'message': '仅支持 POST 请求'})

def register_success(request):
    return render(request=request, template_name='register_success.html')

def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        email_code = request.POST.get('email_code')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        # 密码长度和字符验证
        if not re.match(r'^[a-zA-Z0-9]{6,12}$', new_password):
            messages.error(request, '密码必须为6-12个数字或字母')
            return render(request, 'forgot_password.html')
        
        # 校验两次密码
        if new_password != confirm_password:
            messages.error(request, '两次密码不一致，请重新输入')
            return render(request, 'forgot_password.html')
        
        # 校验邮箱是否存在
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, '该邮箱未注册')
            return render(request, 'forgot_password.html')
        
        # 校验验证码
        record = EmailVerificationCode.objects.filter(email=email).order_by('-created_at').first()
        if not record:
            messages.error(request, "验证码无效")
            return render(request, 'forgot_password.html')
        if record.code != email_code:
            messages.error(request, "验证码错误")
            return render(request, 'forgot_password.html')
        if record.is_expired():
            messages.error(request, "验证码已过期，请重新获取")
            return render(request, 'forgot_password.html')
        
        # 更新密码
        user.set_password(new_password)
        user.save()
        
        # 删除验证码记录
        EmailVerificationCode.objects.filter(email=email).delete()
        
        messages.success(request, '密码重置成功，请使用新密码登录')
        return redirect('users:login')
    
    return render(request, 'forgot_password.html')
