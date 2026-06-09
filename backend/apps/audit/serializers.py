from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "branch",
            "action",
            "entity_type",
            "entity_id",
            "description",
            "metadata",
            "ip_address",
            "created_at",
        ]

    def get_user(self, obj):
        if obj.user:
            return {
                "id": obj.user.id,
                "email": obj.user.email,
                "full_name": obj.user.full_name,
            }
        return None

    def get_branch(self, obj):
        if obj.branch:
            return {
                "id": obj.branch.id,
                "name": obj.branch.name,
                "code": obj.branch.code,
            }
        return None
