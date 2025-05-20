from django.urls import path
from . import views

app_name = 'lostfound'

urlpatterns = [
    path('', views.lost_found_page, name='lost_found_page'),
    path('create/', views.create_item, name='create_item'),
    path('get_chat_users/', views.get_chat_users, name='get_chat_users'),
    path('get_chat_messages/', views.get_chat_messages, name='get_chat_messages'),
    path('send_chat_message/', views.send_chat_message, name='send_chat_message'),
    path('chat_users/', views.chat_users, name='chat_users'),
]