from django.shortcuts import render, redirect
from .models import Admin, Product, InventoryBalance, StockIn, StockOut
from django.contrib import messages
from datetime import date
from django.utils import timezone
from django.db.models import Sum, F
from django.db import transaction
from decimal import Decimal


# -------------------------
# LOGIN VIEW
# -------------------------
def admin_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            admin = Admin.objects.get(email=email)

            # PLAIN PASSWORD CHECK
            if password == admin.password:
                request.session['admin_id'] = admin.admin_id
                request.session['admin_role'] = admin.role

                if admin.role == 'super_admin':
                    return redirect('super_dashboard')
                elif admin.role == 'department_admin':
                    return redirect('department_dashboard')
                elif admin.role == 'inventory_admin':
                    return redirect('inventory_dashboard')
                else:
                    return redirect('admin_login')
            else:
                messages.error(request, 'Incorrect password')

        except Admin.DoesNotExist:
            messages.error(request, 'Admin not found')

    return render(request, 'liong/login.html')


# -------------------------
# DASHBOARD VIEWS
# -------------------------
def super_dashboard(request):
    if request.session.get('admin_role') != 'super_admin':
        return redirect('admin_login')
    return render(request, 'liong/super_dashboard.html')


def department_dashboard(request):
    if request.session.get('admin_role') != 'department_admin':
        return redirect('admin_login')
    return render(request, 'liong/department_dashboard.html')


def inventory_dashboard(request):
    # Only inventory admins can access
    if request.session.get('admin_role') != 'inventory_admin':
        return redirect('admin_login')

    # Fetch all inventory balances with totals
    balances = InventoryBalance.objects.select_related('product').all()

    # Calculate analytics
    total_products = balances.count()
    low_stock_count = 0
    out_of_stock_count = 0
    healthy_stock_count = 0
    
    low_stock_products = []
    
    for b in balances:
        # Calculate current quantity
        b.current_quantity = b.quantity_unit or 0
        b.min_stock = b.min_stock or 0
        
        # Calculate deficit
        b.deficit = max(0, b.min_stock - b.current_quantity) if b.min_stock > 0 else 0
        
        # Categorize stock status
        if b.current_quantity == 0:
            out_of_stock_count += 1
            low_stock_products.append(b)
        elif b.current_quantity <= b.min_stock:
            low_stock_count += 1
            low_stock_products.append(b)
        else:
            healthy_stock_count += 1

    # Get recent activity (last 10 stock in/out records)
    recent_stock_in = StockIn.objects.select_related('product').order_by('-date_in')[:5]
    recent_stock_out = StockOut.objects.select_related('product').order_by('-date_out')[:5]
    
    recent_activity = []
    
    for stock_in in recent_stock_in:
        recent_activity.append({
            'type': 'in',
            'description': f'Stock in: {stock_in.product.item_name}',
            'quantity': f'+{stock_in.quantity}',
            'timestamp': stock_in.date_in
        })
    
    for stock_out in recent_stock_out:
        recent_activity.append({
            'type': 'out',
            'description': f'Stock out: {stock_out.product.item_name}',
            'quantity': f'-{stock_out.quantity}',
            'timestamp': stock_out.date_out
        })
    
    # Sort by timestamp (most recent first)
    recent_activity.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_activity = recent_activity[:5]

    return render(request, 'liong/inventory_dashboard.html', {
        'total_products': total_products,
        'low_stock_count': low_stock_count,
        'out_of_stock_count': out_of_stock_count,
        'healthy_stock_count': healthy_stock_count,
        'low_stock_products': low_stock_products,
        'recent_activity': recent_activity
    })

# -------------------------
# STOCK IN
# -------------------------
def stock_in_view(request):
    if request.session.get('admin_role') != 'inventory_admin':
        return redirect('admin_login')

    products = Product.objects.all()

    if request.method == 'POST':
        product_id = request.POST.get('product')
        quantity = request.POST.get('quantity') or 0
        quantity_meters = request.POST.get('quantity_meters') or 0
        quantity_klg = request.POST.get('quantity_klg') or 0
        date_in = request.POST.get('date_in') or date.today()

        # Validate - removed unit check since it comes from product
        if not product_id:
            messages.error(request, "Please select a product.")
            return redirect('stock_in')

        try:
            product = Product.objects.get(pk=product_id)
            unit = product.unit  # Get unit from the product itself
        except Product.DoesNotExist:
            messages.error(request, "Product not found.")
            return redirect('stock_in')

        admin = Admin.objects.get(pk=request.session.get('admin_id'))

        # Create StockIn record
        StockIn.objects.create(
            product=product,
            unit=unit,  # Use the unit from the product
            quantity=float(quantity),
            quantity_meters=float(quantity_meters),
            quantity_klg=float(quantity_klg),
            date_in=date_in,
            admin=admin
        )

        # Update InventoryBalance
        balance, created = InventoryBalance.objects.get_or_create(
            product=product,
            defaults={
                'unit': unit,  # Use the unit from the product
                'quantity_unit': 0,
                'quantity_meters': 0,
                'quantity_klg': 0
            }
        )

        balance.quantity_unit = (balance.quantity_unit or 0) + float(quantity)
        balance.quantity_meters = (balance.quantity_meters or 0) + float(quantity_meters)
        balance.quantity_klg = (balance.quantity_klg or 0) + float(quantity_klg)
        balance.last_updated = timezone.now()
        balance.save()

        messages.success(request, f"{quantity} {unit} added to {product.item_name}.")
        return redirect('stock_in')

    return render(request, 'liong/stock_in.html', {'products': products})   


# -------------------------
# ADD PRODUCT
# -------------------------
def add_product(request):
    if request.method == 'POST':
        item_name = request.POST.get('item_name')
        unit = request.POST.get('unit')

        if not item_name or not unit:
            messages.error(request, "Please enter product name and select unit.")
            return redirect('stock_in')

        Product.objects.create(item_name=item_name, unit=unit)
        messages.success(request, f'Product "{item_name}" added successfully!')
        return redirect('stock_in')

    # If GET request (shouldn't happen from modal)
    return redirect('stock_in')
    

# -------------------------
# STOCK OUT
# -------------------------
from decimal import Decimal

def stock_out_view(request):
    if request.session.get('admin_role') != 'inventory_admin':
        return redirect('admin_login')

    # Fetch all products with inventory balance
    balances = InventoryBalance.objects.select_related('product').all()
    
    # Prepare product data for JS
    products = {}
    for b in balances:
        products[str(b.product.product_id)] = {
            'item_name': b.product.item_name,
            'unit_type': b.unit,
            'quantity_unit': float(b.quantity_unit),
            'quantity_meters': float(b.quantity_meters),
            'quantity_klg': float(b.quantity_klg)
        }

    if request.method == "POST":
        try:
            product_id = int(request.POST.get("product") or 0)
        except ValueError:
            messages.error(request, "Invalid product selected.")
            return redirect("stock_out")

        # Convert form values to Decimal
        qty_unit = Decimal(request.POST.get("quantity") or 0)
        qty_meters = Decimal(request.POST.get("quantity_meters") or 0)
        qty_klg = Decimal(request.POST.get("quantity_klg") or 0)
        date_out = request.POST.get("date_out") or timezone.now().date()

        try:
            balance = InventoryBalance.objects.get(product_id=product_id)
            unit_type = balance.unit  # Get unit from inventory balance
        except InventoryBalance.DoesNotExist:
            messages.error(request, "Product does not exist in inventory balance.")
            return redirect("stock_out")

        # Check stock availability
        if qty_unit > balance.quantity_unit or \
           qty_meters > balance.quantity_meters or \
           qty_klg > balance.quantity_klg:
            messages.error(request, "Not enough stock available!")
            return redirect("stock_out")

        # Deduct stock using Decimal operations
        balance.quantity_unit -= qty_unit
        balance.quantity_meters -= qty_meters
        balance.quantity_klg -= qty_klg
        balance.save()

        # Save stock-out record
        StockOut.objects.create(
            product_id=product_id,
            unit=unit_type,
            quantity=qty_unit,
            quantity_meters=qty_meters,
            quantity_klg=qty_klg,
            date_out=date_out,
            admin_id=request.session.get("admin_id")
        )

        messages.success(request, "Stock-out recorded successfully!")
        return redirect("stock_out")

    # Recent stock out
    recent_stock_out = StockOut.objects.select_related('product').order_by('-stock_out_id')[:10]

    return render(request, "liong/stock_out.html", {
        "products": balances,  # use balances for <select> options
        "products_json": products,  # for JS
        "recent_stock_out": recent_stock_out
    })
# -------------------------
# BALANCE
# -------------------------
def balance(request):
    if request.session.get('admin_role') != 'inventory_admin':
        return redirect('admin_login')

    balances = InventoryBalance.objects.select_related('product').all()
    return render(request, 'liong/balance.html', {'balances': balances})


# -------------------------
# LOGOUT
# -------------------------
def admin_logout(request):
    request.session.flush()
    return redirect('admin_login')
