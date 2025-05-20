from django.urls import path
from . import views

app_name = "confess"

urlpatterns = [
    path('', views.confession_list, name='confess'),  # 默认首页展示所有表白
    path('create/', views.create_confession, name='create_confession'),
    path('vote/<int:confession_id>/<str:vote_type>/', views.vote_confession, name='vote_confession'),
    path('search/', views.search_confessions, name='search_confessions'),
]
