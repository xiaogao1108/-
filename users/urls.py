from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('',views.login,name='login'),
    path('register/',views.register,name='register'),
    path('send_email_code/', views.send_email_code, name='send_email_code'),
    path('register_success/', views.register_success, name='register_success'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('logout/', views.logout_view, name='logout'),
]



