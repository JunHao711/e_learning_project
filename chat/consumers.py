import json
import logging
from urllib.parse import unquote
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    """ handling real-time group chat communication for a specific Course."""
    async def connect(self):
        '''
        invoked when a client attempts to open a WebSocket connection.
        Extracts the course ID from the URL routing sequence and adds the user 
        to the corresponding Channels group
        '''
        # retrieve the course_id passed via the WebSocket URL route
        self.course_id = self.scope['url_route']['kwargs']['course_id']
        # unique group name for this specific course room
        self.room_group_name = f'chat_{self.course_id}'
        # add websocket channel and accept the incoming connection
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.info(f"WebSocket connected: {self.room_group_name}")

    async def disconnect(self, close_code):
        '''
        invoked when the WebSocket closes for any reason.
        Ensures the channel is removed from the group to prevent memory leaks
        '''
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        logger.info(f"WebSocket disconnected: {self.room_group_name} (Code: {close_code})")

    async def receive(self, text_data):
        '''
        Handles incoming text messages from the WebSocket client.
        '''
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message', '')
            file_url = text_data_json.get('file_url', None) 
            user = self.scope['user']
            # Ensure the user is actually logged in before processing
            if user.is_authenticated:
                await self.save_message(user, self.course_id, message, file_url)
                # Broadcast the message to all channels in this group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'file_url': file_url,
                        'user': user.username,
                        'timestamp': timezone.now().strftime('%H:%M')
                    }
                )
            else:
                await self.send(text_data=json.dumps({'error': 'Authentication required.'}))
                
        except Exception as e:
            logger.error(f"Error processing group chat message: {e}", exc_info=True)
            await self.send(text_data=json.dumps({'error': 'Failed to process message.'}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'file_url': event.get('file_url'),
            'user': event['user'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def save_message(self, user, course_id, message, file_url):
        '''
        ensures Django ORM queries run in a separate thread pool and do not 
        block the main async event loop.
        '''
        from courses.models import Course
        from chat.models import Message
        
        course = Course.objects.get(id=course_id)
        msg = Message(sender=user, course=course, content=message)
        
        if file_url:
            decoded_url = unquote(file_url)
            msg.file.name = decoded_url.replace('/media/', '')
            
        msg.save()
        return msg


class PrivateChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for secure, 1-on-1 private messaging between two users
    """
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('message', '')
            file_url = data.get('file_url', None)
            target_user_id = data.get('target_user_id')
            sender = self.scope['user']

            if sender.is_authenticated and target_user_id:
                await self.save_private_message(sender, target_user_id, message, file_url)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'file_url': file_url, 
                        'user': sender.username,
                        'timestamp': timezone.now().strftime('%H:%M')
                    }
                )
            else:
                 await self.send(text_data=json.dumps({'error': 'Invalid payload or unauthenticated.'}))
                 
        except Exception as e:
            logger.error(f"Error processing private message: {e}", exc_info=True)
            await self.send(text_data=json.dumps({'error': 'Failed to process private message.'}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'file_url': event.get('file_url'),
            'user': event['user'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def save_private_message(self, sender, target_id, message, file_url):
        from django.contrib.auth import get_user_model
        from chat.models import PrivateMessage
        
        User = get_user_model()
        target = User.objects.get(id=target_id)
        
        msg = PrivateMessage(sender=sender, recipient=target, content=message)
        
        if file_url:
            decoded_url = unquote(file_url)
            msg.file.name = decoded_url.replace('/media/', '')
            
        msg.save()