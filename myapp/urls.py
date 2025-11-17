from django.urls import path
from . import views

urlpatterns = [
    path('', views.admin_login, name='admin_login'),
    # Example dashboards (create these views later)
    path('super-dashboard/', views.super_dashboard, name='super_dashboard'),
    path('department-dashboard/', views.department_dashboard, name='department_dashboard'),
    path('inventory-dashboard/', views.inventory_dashboard, name='inventory_dashboard'),
]
