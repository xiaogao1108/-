from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import LostItem, ChatMessage
from django.db.models import Q
from django.http import JsonResponse
from django.contrib.auth import get_user_model

User = get_user_model()


@login_required
def lost_found_page(request):
    query = request.GET.get('q')

    lost_items = LostItem.objects.filter(item_type='lost')
    found_items = LostItem.objects.filter(item_type='found')

    if query:
        lost_items = lost_items.filter(Q(name__icontains=query) | Q(location__icontains=query))
        found_items = found_items.filter(Q(name__icontains=query) | Q(location__icontains=query))

    lost_items = lost_items.order_by('-time')
    found_items = found_items.order_by('-time')

    return render(request, 'lost-and-found.html', {
        'lost_items': lost_items,
        'found_items': found_items,
        'q': query
    })


@login_required
def create_item(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        item_type = request.POST.get('item_type')
        location = request.POST.get('location')
        contact = request.POST.get('contact')
        description = request.POST.get('description')
        image = request.FILES.get('image')

        LostItem.objects.create(
            name=name,
            item_type=item_type,
            location=location,
            contact=contact,
            description=description,
            image=image,
            creator=request.user,
            time=timezone.now()
        )
        return redirect('lostfound:lost_found_page')


@login_required
def get_chat_users(request):
    # 获取与当前用户有过聊天记录的用户
    sent = ChatMessage.objects.filter(sender=request.user).exclude(receiver=request.user).values_list('receiver', flat=True)
    received = ChatMessage.objects.filter(receiver=request.user).exclude(sender=request.user).values_list('sender', flat=True)
    user_ids = set(sent) | set(received)

    users = User.objects.filter(id__in=user_ids)
    data = [{'id': u.id, 'username': u.username} for u in users]
    return JsonResponse(data, safe=False)


@login_required
def get_chat_messages(request):
    user_id = request.GET.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'Missing user_id parameter'}, status=400)

    try:
        user_id = int(user_id)
    except ValueError:
        return JsonResponse({'error': 'Invalid user_id parameter'}, status=400)

    try:
        receiver = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    messages = ChatMessage.objects.filter(
        sender__in=[request.user, receiver],
        receiver__in=[request.user, receiver]
    ).order_by('timestamp')

    message_data = [
        {
            'sender': msg.sender.username,
            'receiver': msg.receiver.username,
            'content': msg.content,
            'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
        for msg in messages
    ]

    return JsonResponse({'messages': message_data, 'currentUser': request.user.username})


@login_required
def send_chat_message(request):
    user_id = request.POST.get('user_id')
    content = request.POST.get('content')

    if not user_id or not content:
        return JsonResponse({'error': 'Missing parameters'}, status=400)

    try:
        user_id = int(user_id)
    except ValueError:
        return JsonResponse({'error': 'Invalid user_id parameter'}, status=400)

    try:
        receiver = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    message = ChatMessage.objects.create(
        sender=request.user,
        receiver=receiver,
        content=content
    )

    return JsonResponse({'status': 'ok',
                         'message': {'sender': message.sender.username, 'receiver': message.receiver.username,
                                     'content': message.content,
                                     'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S')}})


@login_required
def chat_users(request):
    # 返回所有用户（可以根据需要调整）
    users = User.objects.exclude(id=request.user.id)
    return JsonResponse([{'id': u.id, 'username': u.username} for u in users], safe=False)