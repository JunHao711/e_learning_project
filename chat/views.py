from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import HttpResponseForbidden, JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from courses.models import Course
from .models import PrivateMessage

@login_required
def course_chat_room(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if request.user not in course.students.all() and request.user != course.owner:
        return HttpResponseForbidden()
    latest_messages = course.chat_messages.all()[:50]
    return render(request, 'chat/room.html', {
        'course': course,
        'latest_messages': latest_messages
    })

@login_required
def private_chat_room(request, target_user_id):
    User = get_user_model()
    target_user = get_object_or_404(User, id=target_user_id)
    
    if request.user == target_user:
        return redirect('course_list')

    # Get history messages
    messages = PrivateMessage.objects.filter(
        Q(sender=request.user, recipient=target_user) | 
        Q(sender=target_user, recipient=request.user)
    ).order_by('timestamp')[:50]

    # Generate room name
    user1_id = min(request.user.id, target_user.id)
    user2_id = max(request.user.id, target_user.id)
    room_name = f"private_{user1_id}_{user2_id}"

    return render(request, 'chat/private_room.html', {
        'target_user': target_user,
        'chat_messages': messages,
        'room_name': room_name
    })

@login_required
@require_POST
def chat_file_upload(request): 
    # Handle file upload for chat
    if request.FILES.get('file'):
        uploaded_file = request.FILES['file']
        
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        # Save file with unique name
        file_name = f"chat_files/{request.user.id}_{uploaded_file.name}"
        path = default_storage.save(file_name, ContentFile(uploaded_file.read()))
        file_url = default_storage.url(path)
        
        # Return URL to frontend
        return JsonResponse({'status': 'ok', 'url': file_url, 'name': uploaded_file.name})
    
    return JsonResponse({'status': 'error'}, status=400)

@login_required
def get_recent_conversations(request):
    user = request.user
    messages = PrivateMessage.objects.filter(
        Q(sender=user) | Q(recipient=user)
    ).order_by('-timestamp')

    partners = set()
    conversations = []

    for msg in messages:
        partner = msg.recipient if msg.sender == user else msg.sender
        if partner not in partners:
            partners.add(partner)
            
            # Check for photo attribute (assuming user model has 'photo')
            photo_url = "/static/images/default_avatar.png"
            if hasattr(partner, 'photo') and partner.photo:
                photo_url = partner.photo.url
            
            conversations.append({
                'partner_id': partner.id,
                'username': partner.username,
                'photo_url': photo_url,
                'last_message': msg.content[:30] + '...' if msg.content else '[File]',
                'timestamp': msg.timestamp.strftime('%H:%M %d/%m')
            })

    return JsonResponse({'conversations': conversations})