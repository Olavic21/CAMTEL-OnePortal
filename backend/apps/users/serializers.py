from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

ROLE_TO_API = {
    'SUPER_ADMIN': 'super_admin',
    'ADMIN': 'admin',
    'PRODUCT_MANAGER': 'product_manager',
    'EDITOR': 'editor',
    'VIEWER': 'visitor',
}

ROLE_FROM_API = {v: k for k, v in ROLE_TO_API.items()}


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'date_joined',
            'last_login',
        )
        read_only_fields = ('date_joined', 'last_login')

    def validate_role(self, value):
        if value in ROLE_FROM_API:
            return ROLE_FROM_API[value]
        if value in ROLE_TO_API:
            return value
        raise serializers.ValidationError(f'Role invalide: {value}')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['role'] = ROLE_TO_API.get(instance.role, instance.role.lower())
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        return User.objects.create_user(
            role=User.Role.VIEWER,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
