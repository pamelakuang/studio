# -*- coding: utf-8 -*-
# Generated by Django 1.9.7 on 2016-11-07 22:29
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ('contentcuration', '0039_auto_20161101_1555'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='assessment_item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name='files', to='contentcuration.AssessmentItem'),
        ),
    ]