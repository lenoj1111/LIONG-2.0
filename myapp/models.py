from django.db import models

class Admin(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('department_admin', 'Department Admin'),
        ('inventory_admin', 'Inventory Admin'),
    ]

    admin_id = models.AutoField(primary_key=True)  # match your PostgreSQL PK
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.role})"

    class Meta:
        db_table = 'admins'
