from django.contrib import admin

from .models import ExchangeRequest


@admin.register(ExchangeRequest)
class ExchangeRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'learner', 'owner', 'status', 'scheduled_at', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('learner__email', 'owner__email', 'listing__skill__name')
    readonly_fields = ('created_at', 'updated_at')
