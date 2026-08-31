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

# Roles dont la gestion (modification de role, desactivation, suppression,
# creation) est reservee au SUPER_ADMIN — regle RBAC cote serveur (miroir de
# la matrice frontend `canManageAccount`/`getAssignableRoles`).
PRIVILEGED_ROLES = frozenset({'SUPER_ADMIN', 'ADMIN'})
# Roles qu'un ADMIN (non Super Admin) peut attribuer.
ADMIN_ASSIGNABLE_ROLES = frozenset({'PRODUCT_MANAGER', 'EDITOR', 'CUSTOMER', 'VIEWER'})


def role_to_internal(value):
    """Normalise un role API ('super_admin', 'visitor', ...) en code interne."""
    if not value:
        return None
    value = str(value).strip().lower()
    if value in ROLE_FROM_API:
        return ROLE_FROM_API[value]
    if value in ROLE_TO_API:
        return value
    return None


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField()
    # Permet a un Admin/Super Admin de creer un compte immediatement
    # utilisable (mot de passe active). Jamais renvoye en lecture
    # (write_only) et optionnel (le mot de passe peut aussi etre defini
    # plus tard).
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
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
            'password',
            'date_joined',
            'last_login',
        )
        read_only_fields = ('date_joined', 'last_login')

    def get_can_access_backoffice(self, obj) -> bool:
        return can_access_backoffice(obj)

    def validate_role(self, value):
        role_internal = role_to_internal(value)
        if role_internal is None:
            raise serializers.ValidationError(f'Role invalide: {value}')
        # Defense en profondeur : seul un Super Admin peut attribuer un role
        # privilégie (Super Admin / Admin). La vue renvoie aussi un 403
        # explicite avant meme la serialisation.
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            is_super = getattr(request.user, 'role', None) == 'SUPER_ADMIN' or getattr(request.user, 'is_superuser', False)
            if role_internal in PRIVILEGED_ROLES and not is_super:
                raise serializers.ValidationError(
                    'Creation/Mutation du role Admin/Super Admin reservee au Super Admin.'
                )
        return role_internal

    def create(self, validated_data):
        password = validated_data.pop('password', None) or None
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

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
