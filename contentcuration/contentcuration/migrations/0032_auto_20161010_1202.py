# -*- coding: utf-8 -*-
# Generated by Django 1.9.7 on 2016-10-10 19:02
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contentcuration', '0031_auto_20161010_1143'),
    ]

    operations = [
        migrations.RenameField(
            model_name='assessmentitem',
            old_name='help_text',
            new_name='hint',
        ),
    ]