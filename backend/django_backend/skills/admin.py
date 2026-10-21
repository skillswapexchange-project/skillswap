from django.contrib import admin

from .models import Skill, SkillListing


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'updated_at')
    list_filter = ('category',)
    search_fields = ('name', 'category', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(SkillListing)
class SkillListingAdmin(admin.ModelAdmin):
    list_display = ('skill', 'owner', 'direction', 'is_active', 'created_at')
    list_filter = ('direction', 'is_active', 'skill__category')
    search_fields = ('skill__name', 'owner__email', 'description')
