from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.core.permissions import can_access_backoffice

User = get_user_model()

# Mapping API <-> roles internes (cahier des charges #18 : VISITOR supprime
# du RBAC). Le role minimum authentifie est CUSTOMER. Alias legacy :
#   * 'visitor' accepte en ENTREE (shim compat frontend) et mappe sur
#     CUSTOMER — jamais rejete en erreur pour eviter de casser l'UI de
#     gestion des comptes ; la sortie n'emet plus jamais 'visitor'.
#   * VIEWER (deprecié) sort en 'viewer' et sera convertible en CUSTOMER.
ROLE_TO_API = {
    'SUPER_ADMIN': 'super_admin',
    'ADMIN': 'admin',
    'PRODUCT_MANAGER': 'product_manager',
    'EDITOR': 'editor',
    'VIEWER': 'viewer',
    'CUSTOMER': 'customer',
}

ROLE_FROM_API = {v: k for k, v in ROLE_TO_API.items()}
ROLE_FROM_API['visitor'] = 'CUSTOMER'  # shim legacy


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField()
    # Expose au frontend l'info de switch PORTAL <-> BACKOFFICE (#21) ;
    # le backend reste l'autorite reelle sur chaque endpoint (#20).
    can_access_backoffice = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'can_access_backoffice',
            'is_active',
            'date_joined',
            'last_login',
        )
        read_only_fields = ('date_joined', 'last_login')

    def get_can_access_backoffice(self, obj) -> bool:
        return can_access_backoffice(obj)

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
        # Tout compte public cree est CUSTOMER (plus de role VISITOR).
        return User.objects.create_user(
            role=User.Role.CUSTOMER,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
