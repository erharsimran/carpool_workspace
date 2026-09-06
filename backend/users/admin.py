from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = [
        'email',
        'username',
        'phone_number',
        'is_phone_verified',
        'is_staff',
    ]
    fieldsets = UserAdmin.fieldsets + (
        (
            'Carpool Profile',
            {
                'fields': (
                    'phone_number',
                    'is_phone_verified',
                    'is_email_verified',
                    'avatar_url',
                )
            },
        ),
    )