# Script QA temporaire : cree/reinitialise 4 comptes de test (un par role cle).
# Usage : Get-Content qa_setup_users.py | ..\.venv\Scripts\python.exe manage.py shell
from apps.users.models import User

PW = "Test!2026-OP"
USERS = {
    "qa_customer": User.Role.CUSTOMER,
    "qa_editor": User.Role.EDITOR,
    "qa_admin": User.Role.ADMIN,
    "qa_superadmin": User.Role.SUPER_ADMIN,
}

for username, role in USERS.items():
    user, created = User.objects.get_or_create(
        username=username,
        defaults={"email": f"{username}@qa.local", "role": role},
    )
    user.set_password(PW)
    user.role = role
    user.is_active = True
    user.is_staff = role != User.Role.CUSTOMER
    user.is_superuser = role == User.Role.SUPER_ADMIN
    user.save()
    print(f"{'CREATED' if created else 'UPDATED'}: {username} | role={role} | staff={user.is_staff} | super={user.is_superuser}")

print("QA users ready. Password:", PW)
