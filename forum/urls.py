from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    path('', views.forum, name='forum'),
    path('create/', views.create_post, name='create_post'),
    path('vote/<int:post_id>/<str:vote_type>/', views.like_post, name='vote_post'),
    path('search/', views.forum, name='search_posts'),
    path('get_post/<int:post_id>/', views.get_post, name='get_post'),
    path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('post/<int:post_id>/comments/', views.get_comments, name='get_comments'),
    path('post/<int:post_id>/view/', views.view_post, name='view_post'),
    path('upload-image/', views.upload_image, name='upload_image'),
]