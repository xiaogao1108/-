from django import forms
from .models import Material

class MaterialForm(forms.ModelForm):
    class Meta:
        model = Material
        fields = ['title', 'file', 'price', 'description']
        labels = {
            'title': '课件标题',
            'file': '上传文件',
            'price': '收费金额（元）',
            'description': '课件简介（选填）',
        }
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': '请输入课件标题'}),
            'price': forms.NumberInput(attrs={'placeholder': '请输入金额（免费填 0）'}),
            'description': forms.Textarea(attrs={'placeholder': '课件简介，可不填', 'rows': 3}),
        }
