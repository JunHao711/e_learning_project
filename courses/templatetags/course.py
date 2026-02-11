# courses/templatetags/course.py
from django import template
import os
import re
from students.models import UserContentProgress

register = template.Library()

@register.filter
def model_name(obj):
    try:
        return obj._meta.model_name
    except AttributeError:
        return None
        
@register.filter
def model_name_upper(obj):
    try:
        return obj._meta.model_name.upper()
    except AttributeError:
        return None

@register.filter
def is_pdf(file_url):
    """Check if the file is a PDF based on extension"""
    if not file_url:
        return False
    ext = os.path.splitext(file_url)[1].lower()
    return ext == '.pdf'

@register.filter
def embed_url(url):
    """
    Input: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    Output: https://www.youtube.com/embed/dQw4w9WgXcQ
    """
    if not url: return ""
    
    # 如果已经是 embed 链接，直接返回
    if 'embed' in url:
        return url
        
    if 'youtube.com' in url or 'youtu.be' in url:
        # 正则表达式提取 Video ID
        regex = r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
        match = re.match(regex, url)
        if match:
            return f"https://www.youtube.com/embed/{match.group(6)}"
    
    return url

@register.filter
def is_completed(item, user):
    """
    用法: {% if item|is_completed:request.user %}
    检查用户是否完成了该 Item (Content object)
    """
    # item 是 Content 的 item (Text/Video/Image 对象)，
    # 我们需要找到它对应的 Content 对象。
    # 因为我们在 View 里传的是 item (content.item)，这有点绕。
    # 
    # 但是！在 templates/students/course/detail.html 里:
    # {% for content in module.contents.all %} 
    # content 是 Content 模型实例，content.item 是具体素材。
    # 所以我们应该直接判断 Content 模型实例。
    
    if not user.is_authenticated:
        return False
    
    # 注意：这里我们假设传入的是 Content 对象，不是 item 对象
    # 如果传入的是 item (Text/Video)，我们需要反向查，这会很慢。
    # 所以我们在模板里必须传 Content 对象。
    
    return UserContentProgress.objects.filter(student=user, content=item).exists()

