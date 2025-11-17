from django.shortcuts import render, redirect
from .models import Admin
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password

# -------------------------
# Admin Login View
# -------------------------
def admin_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            admin = Admin.objects.get(email=email)

            # If passwords are hashed
            if check_password(password, admin.password):
                # Set session
                request.session['admin_id'] = admin.admin_id
                request.session['admin_role'] = admin.role

                # Redirect based on role
                if admin.role == 'super_admin':
                    return redirect('super_dashboard')
                elif admin.role == 'department_admin':
                    return redirect('department_dashboard')
                elif admin.role == 'inventory_admin':
                    return redirect('inventory_dashboard')
                else:
                    return redirect('admin_login')  # fallback
            else:
                messages.error(request, 'Incorrect password')

        except Admin.DoesNotExist:
            messages.error(request, 'Admin not found')

    return render(request, 'liong/login.html')


# -------------------------
# Role-based Dashboard Views
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
    if request.session.get('admin_role') != 'inventory_admin':
        return redirect('admin_login')
    return render(request, 'liong/inventory_dashboard.html')


# -------------------------
# Logout View
# -------------------------
def admin_logout(request):
    request.session.flush()  # clear all session data
    return redirect('admin_login')
