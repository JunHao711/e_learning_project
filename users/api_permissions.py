from rest_framework.permissions import BasePermission

class IsSiteAdminAPI(BasePermission):
    """
    DRF 权限：只允许 is_admin 为 True 的用户访问该 API 端点
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)