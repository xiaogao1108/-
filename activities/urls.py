from django.urls import path
from . import views

app_name = 'activities'

urlpatterns = [
    path('', views.activities, name='activities'),
    path('create/', views.create_activity, name='create_activity'),
    path('join/<int:activity_id>/', views.join_activity, name='join_activity'),
]
