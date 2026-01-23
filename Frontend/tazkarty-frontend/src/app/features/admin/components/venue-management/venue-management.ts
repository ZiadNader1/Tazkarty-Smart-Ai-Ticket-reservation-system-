import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';
import { LanguageService } from '../../../../core/services/language.service';

interface Venue {
  _id: string;
  name: string;
  location: string;
  capacity?: number;
  image?: string;
  description?: string;
  is_active: boolean;
  halls?: any[];
  createdAt?: Date;
}

interface VenueForm {
  name: string;
  location: string;
  city: string;
  capacity: number | null;
  image: string;
  description: string;
}

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-venue-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './venue-management.html',
  styleUrls: ['./venue-management.scss']
})
export class VenueManagementComponent implements OnInit {
  venues: Venue[] = [];
  filteredVenues: Venue[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Modal states
  showModal = false;
  showDeleteModal = false;
  showViewModal = false;
  isEditMode = false;

  // Form data
  venueForm: VenueForm = this.getEmptyForm();
  editingVenueId: string | null = null;
  deletingVenue: Venue | null = null;
  viewingVenue: Venue | null = null;

  // Search & Filter
  searchQuery = '';
  filterActive: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private adminService: AdminService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadVenues();
  }

  getEmptyForm(): VenueForm {
    return {
      name: '',
      location: '',
      city: '',
      capacity: null,
      image: '',
      description: ''
    };
  }

  loadVenues(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getVenues().subscribe({
      next: (response) => {
        this.venues = response.venues || response;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = this.langService.translate('admin.venue_load_failed');
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.venues];

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query)
      );
    }

    // Apply active filter
    if (this.filterActive !== 'all') {
      const isActive = this.filterActive === 'active';
      filtered = filtered.filter(v => v.is_active === isActive);
    }

    this.filteredVenues = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.venueForm = this.getEmptyForm();
    this.editingVenueId = null;
    this.showModal = true;
  }

  openEditModal(venue: Venue): void {
    this.isEditMode = true;
    this.editingVenueId = venue._id;
    this.venueForm = {
      name: venue.name,
      location: venue.location,
      city: venue.location?.split(',')[0] || (venue as any).city || 'Cairo', // Fallback
      capacity: venue.capacity || null,
      image: venue.image || '',
      description: venue.description || ''
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.venueForm = this.getEmptyForm();
    this.editingVenueId = null;
  }

  saveVenue(): void {
    if (!this.venueForm.name || !this.venueForm.location || !this.venueForm.city) {
      this.error = this.langService.translate('admin.fill_required_fields');
      return;
    }

    this.loading = true;
    this.error = null;

    const venueData = {
      ...this.venueForm,
      is_active: true
    };

    const request = this.isEditMode && this.editingVenueId
      ? this.adminService.updateVenue(this.editingVenueId, venueData)
      : this.adminService.createVenue(venueData);

    request.subscribe({
      next: () => {
        this.successMessage = this.langService.translate(this.isEditMode ? 'admin.venue_update_success' : 'admin.venue_create_success');
        this.closeModal();
        this.loadVenues();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || this.langService.translate('admin.venue_save_failed');
        this.loading = false;
      }
    });
  }

  openDeleteModal(venue: Venue): void {
    this.deletingVenue = venue;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingVenue = null;
  }

  confirmDelete(): void {
    if (!this.deletingVenue) return;

    this.loading = true;

    this.adminService.deleteVenue(this.deletingVenue._id).subscribe({
      next: () => {
        this.successMessage = this.langService.translate('admin.venue_delete_success');
        this.closeDeleteModal();
        this.loadVenues();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = this.langService.translate('admin.venue_delete_failed');
        console.error(err);
        this.loading = false;
      }
    });
  }

  openViewModal(venue: Venue): void {
    this.loading = true;

    // Fetch full venue details with halls
    this.adminService.getVenueById(venue._id).subscribe({
      next: (data) => {
        this.viewingVenue = data;
        this.showViewModal = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.langService.translate('admin.venue_load_failed');
        console.error(err);
        this.loading = false;
      }
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingVenue = null;
  }

  toggleVenueStatus(venue: Venue): void {
    const updatedData = {
      ...venue,
      is_active: !venue.is_active
    };

    this.adminService.updateVenue(venue._id, updatedData).subscribe({
      next: () => {
        this.successMessage = this.langService.translate(updatedData.is_active ? 'admin.venue_activated' : 'admin.venue_deactivated');
        this.loadVenues();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = this.langService.translate('admin.venue_update_failed');
        console.error(err);
      }
    });
  }

  // ... Previous methods

  // Helper for UI
  hasMissingMaps(venue: any): boolean {
    if (!venue.halls || venue.halls.length === 0) return false;
    return venue.halls.some((h: any) => !h.seat_map_config);
  }

  getTotalHallCapacity(venue: any): number {
    if (!venue.halls) return 0;
    return venue.halls.reduce((sum: number, h: any) => sum + (h.capacity || 0), 0);
  }

  // ============== HALL MANAGEMENT ==============
  showHallModal = false;
  isHallEditMode = false;
  editingHallId: string | null = null;
  hallForm: {
    name: string;
    capacity: number;
    seat_categories: { name: string, count: number }[];
  } = {
      name: '',
      capacity: 0,
      seat_categories: []
    };

  openAddHallModal(): void {
    this.isHallEditMode = false;
    this.editingHallId = null;
    this.hallForm = { name: '', capacity: 100, seat_categories: [] };
    this.showHallModal = true;
  }

  openEditHallModal(hall: any): void {
    this.isHallEditMode = true;
    this.editingHallId = hall._id;
    this.hallForm = {
      name: hall.name,
      capacity: hall.capacity,
      seat_categories: hall.seat_categories || []
    };
    this.showHallModal = true;
  }

  closeHallModal(): void {
    this.showHallModal = false;
    this.hallForm = { name: '', capacity: 0, seat_categories: [] };
    this.editingHallId = null;
  }

  addSeatCategory(): void {
    this.hallForm.seat_categories.push({ name: '', count: 0 });
  }

  removeSeatCategory(index: number): void {
    this.hallForm.seat_categories.splice(index, 1);
  }

  saveHall(): void {
    if (!this.viewingVenue) return;

    // Validation: Check Capacity vs Categories
    const totalSeats = this.hallForm.seat_categories.reduce((sum, cat) => sum + (Number(cat.count) || 0), 0);
    if (this.hallForm.capacity && totalSeats > this.hallForm.capacity) {
      this.error = this.langService.translate('admin.capacity_exceed_error');
      return;
    }

    this.loading = true;
    const hallData = {
      ...this.hallForm,
      venue_id: this.viewingVenue._id
    };

    const request = this.isHallEditMode && this.editingHallId
      ? this.adminService.updateHall(this.editingHallId, hallData)
      : this.adminService.createHall(hallData);

    request.subscribe({
      next: () => {
        // Refresh venue details to see new hall
        if (this.viewingVenue) {
          this.openViewModal(this.viewingVenue); // Reloads venue data
        }
        this.loadVenues(); // Refresh the main list (to update card stats)
        this.closeHallModal();
        this.successMessage = this.langService.translate('admin.hall_save_success');
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error(err);
        this.error = this.langService.translate('admin.hall_save_error');
        this.loading = false;
      }
    });
  }

  deleteHall(hallId: string): void {
    if (!confirm(this.langService.translate('admin.delete_confirm'))) return;

    this.loading = true;
    this.adminService.deleteHall(hallId).subscribe({
      next: () => {
        if (this.viewingVenue) {
          this.openViewModal(this.viewingVenue);
        }
        this.loadVenues(); // Refresh main list
        this.successMessage = this.langService.translate('admin.hall_delete_success');
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error(err);
        this.error = this.langService.translate('admin.hall_delete_failed');
        this.loading = false;
      }
    });
  }

}