from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.branches.models import Branch, UserBranch

User = get_user_model()


class MeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    phone = serializers.CharField()
    role = serializers.CharField()


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "is_active",
            "date_joined",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "password",
            "branch_ids",
            "is_active",
        ]

    def create(self, validated_data):
        branch_ids = validated_data.pop("branch_ids", [])
        password = validated_data.pop("password")

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        for index, branch_id in enumerate(branch_ids):
            branch = Branch.objects.get(id=branch_id)
            UserBranch.objects.get_or_create(
                user=user,
                branch=branch,
                defaults={"is_default": index == 0},
            )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "full_name",
            "phone",
            "role",
            "is_active",
        ]


class UserBranchAssignSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )
    default_branch_id = serializers.IntegerField(required=False)

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist.")
        return value

    def validate_branch_ids(self, value):
        existing_count = Branch.objects.filter(id__in=value).count()
        if existing_count != len(set(value)):
            raise serializers.ValidationError("One or more branches do not exist.")
        return value
