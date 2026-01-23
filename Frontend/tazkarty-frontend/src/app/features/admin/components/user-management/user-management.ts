// =====================================================
// FILE: src/app/features/admin/components/user-management/user-management.ts
// User Management Component
// =====================================================

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  bookings_count: number;
  total_spent: number;
  is_active: boolean;
  role: 'user' | 'admin';
}

import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss']
})
export class UserManagementComponent implements OnInit {
  users = signal<AdminUser[]>([]);

  loading = signal(false);
  searchQuery = '';
  filterStatus = 'all';
  filterRole: 'all' | 'user' | 'admin' = 'all'; // New Role Filter

  showUserModal = signal(false);
  selectedUser = signal<AdminUser | null>(null);

  constructor(
    private adminService: AdminService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: (response) => {
        // Backend now returns array directly or inside obj
        const rawUsers = Array.isArray(response) ? response : (response.users || []);

        const users: AdminUser[] = rawUsers.map((u: any) => ({
          bookings_count: u.bookings_count ?? 0,
          total_spent: u.total_spent ?? 0,
          is_active: u.is_active ?? true,
          role: u.role || 'user',
          ...u
        }));
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
      }
    });
  }

  filteredUsers = computed(() => {
    let filtered = this.users();

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (this.filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === this.filterRole);
    }

    return filtered;
  });

  viewUser(user: AdminUser): void {
    this.selectedUser.set(user);
    this.showUserModal.set(true);
  }

  closeModal(): void {
    this.showUserModal.set(false);
    this.selectedUser.set(null);
  }

  makeAdmin(user: AdminUser): void {
    if (!confirm(`Are you sure you want to promote ${user.name} to Admin? They will have full access!`)) return;

    this.adminService.updateUser(user._id, { role: 'admin' }).subscribe({
      next: () => {
        alert(`${user.name} is now an Admin!`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error upgrading user:', err);
        alert('Failed to upgrade user');
      }
    });
  }

  removeAdmin(user: AdminUser): void {
    if (!confirm(`Are you sure you want to remove Admin privileges from ${user.name}?`)) return;

    this.adminService.updateUser(user._id, { role: 'user' }).subscribe({
      next: () => {
        alert(`${user.name} is now a regular User.`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error downgrading user:', err);
        alert('Failed to downgrade user');
      }
    });
  }

  deleteUser(userId: string): void {
    if (confirm('Delete this user permanently? This cannot be undone.')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          alert('User deleted!');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user');
        }
      });
    }
  }

  exportUsers(): void {
    alert('Exporting users data...');
    // TODO: Implement export
  }
}