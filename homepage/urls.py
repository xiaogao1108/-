from django.urls import path
from . import views

urlpatterns = [
    path('',views.homepage,name='homepage'),
    path('upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('select_default_avatar/', views.select_default_avatar, name='select_default_avatar'),
]


