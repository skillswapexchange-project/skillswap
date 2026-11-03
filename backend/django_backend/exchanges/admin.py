from django.contrib import admin

from .models import Exchange


@admin.register(Exchange)
class ExchangeAdmin(admin.ModelAdmin):
    list_display = ('id', 'initiator', 'receiver', 'skill', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = (
        'initiator__email',
        'receiver__email',
        'notes',
    )
    readonly_fields = ('created_at', 'updated_at')

