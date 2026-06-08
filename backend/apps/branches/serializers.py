from rest_framework import serializers

from .models import Branch, UserBranch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = [
            "id",
            "name",
            "code",
            "location",
            "phone",
            "email",
            "is_active",
        ]


class UserBranchSerializer(serializers.ModelSerializer):
    branch = BranchSerializer()

    class Meta:
        model = UserBranch
        fields = [
            "id",
            "branch",
            "is_default",
        ]
