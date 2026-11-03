from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'exchange', 'reviewer', 'reviewee', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = (
        'reviewer__email',
        'reviewer__first_name',
        'reviewer__last_name',
        'reviewee__email',
        'reviewee__first_name',
        'reviewee__last_name',
        'feedback',
    )
    readonly_fields = ('created_at', 'updated_at')

