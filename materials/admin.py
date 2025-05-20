from django.contrib import admin
from .models import Material, PaymentOrder

# 定义Material的管理界面
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'upload_time', 'uploaded_by', 'download_count')
    list_filter = ('upload_time', 'price')
    search_fields = ('title', 'description')
    readonly_fields = ('download_count',)
    
# 定义PaymentOrder的管理界面
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'material', 'user', 'amount', 'status', 'created_at', 'paid_at')
    list_filter = ('status', 'created_at', 'paid_at')
    search_fields = ('order_id', 'trade_no')
    readonly_fields = ('created_at', 'paid_at')

# 注册模型
admin.site.register(Material, MaterialAdmin)
admin.site.register(PaymentOrder, PaymentOrderAdmin)
