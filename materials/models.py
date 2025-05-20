from django.db import models
from django.conf import settings
import os

class Material(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    upload_time = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    download_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title
    
    def get_file_extension(self):
        """获取文件扩展名"""
        _, extension = os.path.splitext(self.file.name)
        return extension.lower()[1:]  # 去掉点号

class PaymentOrder(models.Model):
    """支付宝支付订单"""
    STATUS_CHOICES = (
        ('created', '已创建'),
        ('paid', '已支付'),
        ('failed', '支付失败'),
        ('closed', '已关闭'),
    )
    
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='payment_orders')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_id = models.CharField(max_length=64, unique=True)  # 支付宝订单号
    trade_no = models.CharField(max_length=64, blank=True, null=True)  # 支付宝交易号
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"订单 {self.order_id} - {self.get_status_display()}"
