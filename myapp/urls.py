from django.urls import path
from myapp import views

urlpatterns = [
    # Login + Dashboard Routes
    path('', views.admin_login, name='root_login'),
    path('admin/', views.admin_login, name='admin_login'),

    path('super-dashboard/', views.super_dashboard, name='super_dashboard'),
    path('department-dashboard/', views.department_dashboard, name='department_dashboard'),
    path('inventory-dashboard/', views.inventory_dashboard, name='inventory_dashboard'),

    # Inventory Functions
    path('inventory-dashboard/stock-in/', views.stock_in_view, name='stock_in'),
    path('inventory-dashboard/stock-out/', views.stock_out_view, name='stock_out'),
    path('inventory-dashboard/add-product/', views.add_product, name='add_product'),
    path('inventory-dashboard/balance/', views.balance, name='balance'),
]
