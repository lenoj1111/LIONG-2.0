from django.db import models

class Admin(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('department_admin', 'Department Admin'),
        ('inventory_admin', 'Inventory Admin'),
    ]

    admin_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.role})"

    class Meta:
        db_table = 'admins'


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=100)
    unit = models.CharField(max_length=50, default='pieces')


    def __str__(self):
        return self.item_name

    class Meta:
        db_table = 'products'  # Explicit table name


class InventoryBalance(models.Model):
    balance_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    unit = models.CharField(max_length=20)
    opening_inventory = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_meters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_klg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    procurement_suggestion = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.item_name} - {self.unit}"

    class Meta:
        db_table = 'inventory_balance'  # Explicit table name
# models.py (add below InventoryBalance)

class StockIn(models.Model):
    stock_in_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    unit = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_meters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_klg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_in = models.DateField()
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)

    class Meta:
        db_table = 'stock_in'

    def __str__(self):
        return f"{self.product.item_name} - {self.quantity} {self.unit} (In)"

class StockOut(models.Model):
    stock_out_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    unit = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_meters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_klg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_out = models.DateField()
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)

    class Meta:
        db_table = 'stock_out'

    def __str__(self):
        return f"{self.product.item_name} - {self.quantity} {self.unit} (Out)"
