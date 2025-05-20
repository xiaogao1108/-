from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db import transaction

from .models import Material, PaymentOrder
from .forms import MaterialForm
from .alipay_utils import create_alipay_order, generate_order_id, verify_alipay_payment, get_alipay_client

def materials(request):
    form = MaterialForm()
    materials = Material.objects.all().order_by('-upload_time')
    # 传递头像选择所需的数据
    avatar_range = range(1, 13)  # 1-12的默认头像
    return render(request, 'materials.html', {
        'form': form, 
        'materials': materials,
        'avatar_range': avatar_range
    })

@login_required
def upload_material(request):
    if request.method == 'POST':
        form = MaterialForm(request.POST, request.FILES)
        if form.is_valid():
            material = form.save(commit=False)
            material.uploaded_by = request.user
            material.save()
    return redirect('materials:materials')

@login_required
def create_payment(request, material_id):
    """创建支付宝订单"""
    material = get_object_or_404(Material, id=material_id)
    
    # 免费课件不需要创建支付订单
    if material.price <= 0:
        return JsonResponse({'error': '该课件是免费的，无需支付'}, status=400)
    
    # 生成订单
    order_id = generate_order_id()
    
    # 创建本地订单记录
    order = PaymentOrder.objects.create(
        material=material,
        user=request.user,
        order_id=order_id,
        amount=material.price,
        status='created'
    )
    
    # 调用支付宝创建订单
    pay_url = create_alipay_order(
        order_id=order_id,
        subject=f"课件: {material.title}",
        total_amount=float(material.price)
    )
    
    if pay_url:
        return JsonResponse({
            'success': True,
            'pay_url': pay_url,
            'order_id': order_id
        })
    else:
        order.status = 'failed'
        order.save()
        return JsonResponse({'error': '创建支付订单失败'}, status=500)

@csrf_exempt
def alipay_notify(request):
    """支付宝异步通知接口"""
    if request.method == 'POST':
        data = request.POST.dict()
        success, data = verify_alipay_payment(data)
        
        if success:
            # 获取订单号
            out_trade_no = data.get('out_trade_no')
            trade_no = data.get('trade_no')
            
            # 更新订单状态
            with transaction.atomic():
                try:
                    order = PaymentOrder.objects.get(order_id=out_trade_no)
                    if order.status != 'paid':
                        order.status = 'paid'
                        order.trade_no = trade_no
                        order.paid_at = timezone.now()
                        order.save()
                        
                        # 增加下载次数
                        material = order.material
                        material.download_count += 1
                        material.save()
                except PaymentOrder.DoesNotExist:
                    # 订单不存在
                    pass
            
            # 返回成功处理消息给支付宝
            return HttpResponse('success')
        
    # 处理失败或非法请求
    return HttpResponse('fail')

@login_required
def download_material(request, material_id):
    """下载免费课件"""
    material = get_object_or_404(Material, id=material_id)

    # 只允许免费文件直接下载
    if material.price > 0:
        return JsonResponse({'error': '需要付费'}, status=403)

    material.download_count += 1
    material.save()

    file_handle = material.file.open('rb')
    response = FileResponse(file_handle, as_attachment=True, filename=material.file.name.split('/')[-1])
    return response

@login_required
def download_after_payment(request, material_id):
    """付费下载课件"""
    material = get_object_or_404(Material, id=material_id)
    
    # 检查是否有已支付的订单
    has_paid = PaymentOrder.objects.filter(
        material=material,
        user=request.user,
        status='paid'
    ).exists()
    
    # 免费课件或有已支付订单才允许下载
    if material.price <= 0 or has_paid:
        file_handle = material.file.open('rb')
        filename = material.file.name.split('/')[-1]
        return FileResponse(file_handle, as_attachment=True, filename=filename)
    
    return JsonResponse({'error': '未支付课件无法下载'}, status=403)

@login_required
def simulate_payment(request, material_id):
    """模拟支付成功（演示用）"""
    material = get_object_or_404(Material, id=material_id)
    
    # 获取URL中传递的order_id参数
    specific_order_id = request.GET.get('order_id')
    
    if specific_order_id:
        # 如果提供了特定订单ID，更新该订单状态
        try:
            order = PaymentOrder.objects.get(order_id=specific_order_id, user=request.user)
            if order.status != 'paid':
                order.status = 'paid'
                order.trade_no = f'simulated_{specific_order_id}'
                order.paid_at = timezone.now()
                order.save()
                
                # 增加下载次数
                material.download_count += 1
                material.save()
                
                # 直接跳转到下载页面
                return redirect('materials:download_after_payment', material_id=material_id)
        except PaymentOrder.DoesNotExist:
            pass
    else:
        # 原有的创建新订单逻辑
        order_id = generate_order_id()
        PaymentOrder.objects.create(
            material=material,
            user=request.user,
            order_id=order_id,
            amount=material.price,
            status='paid',
            trade_no=f'simulated_{order_id}',
            paid_at=timezone.now()
        )
        
        # 增加下载次数
        material.download_count += 1
        material.save()
    
    return JsonResponse({'success': True, 'message': '支付成功'})

@login_required
def check_payment_status(request, order_id):
    """检查订单支付状态"""
    try:
        order = PaymentOrder.objects.get(order_id=order_id, user=request.user)
        
        # 如果本地已标记为已支付，直接返回
        if order.status == 'paid':
            return JsonResponse({
                'status': 'paid',
                'paid': True
            })
        
        # 如果本地未标记为已支付，尝试从支付宝查询支付状态
        alipay_client = get_alipay_client()
        
        if alipay_client:
            try:
                # 向支付宝查询订单状态
                response = alipay_client.api_alipay_trade_query(out_trade_no=order_id)
                
                # 检查是否成功且交易已支付
                if response.get('code') == '10000' and response.get('trade_status') in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
                    # 更新本地订单状态
                    order.status = 'paid'
                    order.trade_no = response.get('trade_no', '')
                    order.paid_at = timezone.now()
                    order.save()
                    
                    # 增加下载次数
                    material = order.material
                    material.download_count += 1
                    material.save()
                    
                    return JsonResponse({
                        'status': 'paid',
                        'paid': True,
                        'message': '支付已完成'
                    })
                    
            except Exception as e:
                print(f"查询支付宝订单状态出错: {e}")
        
        # 返回当前状态
        return JsonResponse({
            'status': order.status,
            'paid': order.status == 'paid'
        })
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'error': '订单不存在'}, status=404)
