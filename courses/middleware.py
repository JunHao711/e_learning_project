from django.utils.deprecation import MiddlewareMixin

class SecurityHeaderMiddleware(MiddlewareMixin):
    '''
    Allow specific trusted sources to embed our media files
    blocking any malicious third-party embedding
    '''
    def process_response(self, request, response):
        response['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173"
        
        if 'X-Frame-Options' in response:
            del response['X-Frame-Options']
            
        return response