from django import forms
from .models import Activity

class ActivityForm(forms.ModelForm):
    class Meta:
        model = Activity
        fields = ['title', 'datetime', 'location', 'description', 'image']
        labels = {
            'title': '活动名称',
            'datetime': '活动时间（格式：YYYY-MM-DD hh:mm）',
            'location': '活动地点',
            'description': '活动简介（选填）',
            'image': '活动图片（选填）',
        }
        widgets = {
            'title': forms.TextInput(attrs={
                'placeholder': '请输入活动标题',
                'class': 'form-control'
            }),
            'datetime': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'placeholder': '请选择活动开始时间',
                'class': 'form-control'
            }),
            'location': forms.TextInput(attrs={
                'placeholder': '请输入活动地点',
                'class': 'form-control'
            }),
            'description': forms.Textarea(attrs={
                'placeholder': '简要介绍活动内容（可不填）',
                'class': 'form-control',
                'rows': 4
            }),
            'image': forms.ClearableFileInput(attrs={
                'class': 'form-control'
            }),
        }
