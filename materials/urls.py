from django.urls import path
from . import views

app_name = 'materials'

urlpatterns = [
    path('', views.materials, name='materials'),
    path('upload/', views.upload_material, name='upload_material'),
    path('create_payment/<int:material_id>/', views.create_payment, name='create_payment'),
    path('pay/<int:material_id>/', views.simulate_payment, name='simulate_payment'),
    path('check_payment/<str:order_id>/', views.check_payment_status, name='check_payment_status'),
    path('alipay_notify/', views.alipay_notify, name='alipay_notify'),
    path('download/<int:material_id>/', views.download_material, name='download_material'),
    path('download_paid/<int:material_id>/', views.download_after_payment, name='download_after_payment'),
]
