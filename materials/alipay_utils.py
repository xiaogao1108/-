from datetime import datetime
import os
from alipay import AliPay
from django.conf import settings
import uuid

# 沙箱密钥配置 - 替换为你在支付宝沙箱中生成的密钥
# 在实际生产环境中不要在代码中直接存储密钥
ALIPAY_APPID = '2021000148684349'  # 用户提供的沙箱应用ID

# 服务器回调地址，生产环境需修改为你的实际服务器地址
# 本地开发环境可以使用内网穿透工具如ngrok获取公网地址
NOTIFY_URL = 'http://127.0.0.1:8000/materials/alipay_notify/'  # 异步通知地址
RETURN_URL = 'http://127.0.0.1:8000/materials/'  # 同步返回地址

# 默认密钥内容，用于开发测试（实际应用中应该使用真实密钥文件）
DEFAULT_APP_PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
MIIEogIBAAKCAQEAl4mthlag73+DMRUrcNZeIMIetdoRK7LDYp7rdjM5ZyZzyFzoDvpls+dSR/yqZnyWPpYtuV0ubCH1ULdSgAcnX4se5UY8HWspfi5MZ4/NIS+c7nm6plT786C/V3ivXRoPbFS7E4Wrz0g9TX4+YT0xXGQDLXQFxqhAQsDru3kKFarHm1BRerPVBFWOsQOOOqZyVD/grXYxk5x7pbV/H59zGv/ItUwjushDFeFBTKiJE8v8jEAOlpPXAK+PT79HBsydOhZhH3fSxZ5zdufcuLzOSOzAvZAPsc2fiq1LA4Z2YUQC3Oj9Rkw4EmuyOn+R5tzMY9R7gCfJ3BUK2btzZWWlIQIDAQABAoIBAEEGaRmOLrzWgJsdNGjU88smwTrTei7AJKs6+lrcHDOxAlnl1AYpWF7cUihluVEFAQuWMcSqwXLRF40tPQ+HAlQzRGypuL3+7+0fPNXrlOA6qCKExZz+NqcSQUjtloJi3l9j9GqqH1Fw9C0+kNH1CitVFy/360qVhA2g7wahJ7ynxKLCBB1rd+FHuymC6QNmZjmjU4g5QE6CQc62cBtB8IrLhDsn/5wnqFbxlaCxcq3zrCcavdCYNF8hW+MQDbSTeUCy+mT3PBynaCSez+d2FQXIfTI5bYxJd87+DWryqQAQuFEqj4JxEv9xq9JG8Bxytg78xFageSjCPZmaHhYkeOECgYEAy5NqR8CEoR531RCrBdCtrB4D+cbXL6QqWF+jjkJ7xHaNC1wsNjIPZywiqX2SjqasCSngLP07qDn46wiNTU6qsmd1yGniJ+eYd89h5DqFLeXDyUQIsjTc8A5pJXWVkLwu1UYCfzphPTLg611i+KwVg+nE+oMUvkc+YT3kRyUOZ30CgYEAvo+xr8r5dr61LOqEmxKay9sBgOBZ2tkxSKSBHqyCfBOZAAgx+0v0suzNykZF9TAz+g8XI2vPY6v9KftiZcAPSzAGJExWPqrwzT795DC/zk4ZhM3tip/Qej7pdPrVK1BoSWjr1sHUrqgUUIXOICBV1aI3YcnQ50RDNKuqGL/7DXUCgYB0/EC9/O76m8SnJw3wqIu09ga42cA8+2zuHf+iN6hiLPI+jfhGKJxbYKyGk8fNvA/usCbIE7ndoXreraptu4AyR2wTAG3bGqauavlJKyvvRTMujK8moWQ5ez6HLTwG0W1kV/gFXuoUPhGsj5zZZCJ1DLiKcRtRgSViwitViwDtDQKBgHwTs+5yitv2cKE+Uflms8PoZaI0ck08/gn+ktQWHyAK4qRSsbieTEX0SkpaV1K+gBlhmf9GQ1LyuXSMahU2aL7cFiOsULudMg1x5n6d/0WlNJh0PSb1yBjQvdGdQQ9i24Rw/J5otsLCTffgJ8ZjR4BCjyzs60ip+dhhre9PkXfBAoGANAWE6VTOZvfs1coeMHmHG/8GwvigaCCemaydhWjbHuKvX44VdNH/a9N+J0S1TUWVDx5Zs63KcAwyDI0WCsi4ZklPk0wgp51EXCtzuC4AeluXObk39POtFZDpf9DZs1iRzcp2ApTeOHpIXIAw3t9MF7SQ9zhcFznrgG1yC6MgRZE=
-----END PRIVATE KEY-----"""

DEFAULT_ALIPAY_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlMuZyXAWAXnk1pGZ82uxjZ+q0xRniZq0rbdGof8A+2eIhXv8uGK9Fxzhp8ct9SBqkWkGReKQz26c4sbTMKmvVx7Qt+qRknU6AcivaPv+YazVb9iUXkCSXqAidC0f3R8JTA+YO6C8857MIDhgZoGKNP6DMBB9xQiOwgeJhbZZOc3o2m6s1WvnNPCHiUa2S2lyIfJHmJooSaPEmHjbl9Ya126opLDNop2Uu2f4rSylqIhg3U5h7v2YjoiFJNBdf48vM1AHiVPuh3/ZipkbJ6kbus39n4g4kMHKbtXLoRQbtZpmFPkIVeDCr5tskl4NkqpldQtu/gKUQ4PBhjk/SuKY7wIDAQAB
-----END PUBLIC KEY-----"""

def get_alipay_client():
    """
    获取支付宝客户端
    """
    try:
        # 直接使用默认密钥字符串，不再尝试读取文件
        app_private_key_string = DEFAULT_APP_PRIVATE_KEY
        alipay_public_key_string = DEFAULT_ALIPAY_PUBLIC_KEY
        
        alipay_client = AliPay(
            appid=ALIPAY_APPID,
            app_notify_url=NOTIFY_URL,
            app_private_key_string=app_private_key_string,
            alipay_public_key_string=alipay_public_key_string,
            sign_type="RSA2",
            debug=True  # 沙箱模式设置为True，生产环境设置为False
        )
        return alipay_client
    except Exception as e:
        print(f"初始化支付宝客户端失败: {e}")
        return None

def generate_order_id():
    """
    生成唯一订单号
    """
    return f"material_{uuid.uuid4().hex[:16]}_{int(datetime.now().timestamp())}"

def create_alipay_order(order_id, subject, total_amount):
    """
    创建支付宝预订单
    """
    alipay_client = get_alipay_client()
    if not alipay_client:
        return None
    
    try:
        # 创建电脑网站支付订单
        order_string = alipay_client.api_alipay_trade_page_pay(
            out_trade_no=order_id,
            total_amount=float(total_amount),
            subject=subject,
            return_url=RETURN_URL,
            notify_url=NOTIFY_URL
        )
        
        # 返回支付宝支付链接
        if order_string:
            # 修改网关地址，使用更稳定的网关
            pay_url = f"https://openapi-sandbox.dl.alipaydev.com/gateway.do?{order_string}"
            return pay_url
        return None
    except Exception as e:
        print(f"创建支付宝订单失败: {e}")
        return None

def verify_alipay_payment(data):
    """
    验证支付宝回调的支付结果
    """
    alipay_client = get_alipay_client()
    if not alipay_client:
        return False, {}
    
    try:
        # 移除sign和sign_type参数
        signature = data.pop("sign", None)
        sign_type = data.pop("sign_type", None)
        
        # 验证签名
        if alipay_client.verify(data, signature):
            # 验证通过后的业务处理
            trade_status = data.get('trade_status')
            
            # 根据支付宝的文档，只有TRADE_SUCCESS和TRADE_FINISHED两种状态表示支付成功
            if trade_status in ('TRADE_SUCCESS', 'TRADE_FINISHED'):
                return True, data
        return False, {}
    except Exception as e:
        print(f"验证支付宝支付结果失败: {e}")
        return False, {} 