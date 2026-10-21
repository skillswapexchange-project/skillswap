import django.db.models.deletion
import django.db.models.functions.text
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Skill',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('slug', models.SlugField(max_length=170, unique=True)),
                ('category', models.CharField(blank=True, max_length=100)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='SkillListing',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('direction', models.CharField(choices=[('OFFER', 'Offering to teach'), ('LEARN', 'Wanting to learn')], max_length=5)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='skill_listings', to=settings.AUTH_USER_MODEL)),
                ('skill', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listings', to='skills.skill')),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='skill',
            constraint=models.UniqueConstraint(django.db.models.functions.text.Lower('name'), name='skills_name_ci_uniq'),
        ),
        migrations.AddConstraint(
            model_name='skilllisting',
            constraint=models.UniqueConstraint(fields=('owner', 'skill', 'direction'), name='skills_listing_owner_skill_direction_uniq'),
        ),
        migrations.AddIndex(
            model_name='skilllisting',
            index=models.Index(fields=['skill', 'direction', 'is_active'], name='skills_list_search_idx'),
        ),
    ]
