# -*- coding: utf-8 -*-
# Generated by Django 1.9.13 on 2017-07-27 18:33
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ('contentcuration', '0071_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='contentnode',
            name='language',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name='content_language', to='contentcuration.Language'),
        ),
    ]