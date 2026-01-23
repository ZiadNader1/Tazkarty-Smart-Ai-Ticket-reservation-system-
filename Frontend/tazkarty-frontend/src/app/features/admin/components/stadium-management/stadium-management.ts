import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface Stadium {
    _id: string;
    name: string;
    location: string;
    city: string;
    capacity?: number;
    image?: string;
    layout_image?: string;
    description?: string;
    is_active: boolean;
    halls?: any[];
    createdAt?: Date;
}

interface StadiumForm {
    name: string;
    location: string;
    city: string;
    capacity: number | null;
    image: string; // URL
    layout_image: string; // URL
    description: string;
}

import { LanguageService } from '../../../../core/services/language.service';

@Component({
    selector: 'app-stadium-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './stadium-management.html'
})
export class StadiumManagementComponent implements OnInit {
    stadiums: Stadium[] = [];
    filteredStadiums: Stadium[] = [];
    loading = false;
    error: string | null = null;
    successMessage: string | null = null;

    // Modal states
    showModal = false;
    showDeleteModal = false;
    showViewModal = false;
    isEditMode = false;

    // Form data
    stadiumForm: StadiumForm = this.getEmptyForm();
    editingStadiumId: string | null = null;
    deletingStadium: Stadium | null = null;
    viewingStadium: Stadium | null = null;

    // File Uploads
    selectedImageFile: File | null = null;
    selectedLayoutFile: File | null = null;

    // Search & Filter
    // Search & Filter
    searchQuery = '';
    filterActive: 'all' | 'active' | 'inactive' = 'all';

    // Helper for images
    getImageUrl(path: string | undefined): string {
        if (!path) return '';
        if (path.startsWith('http')) return path; // Already full URL
        // Assume relative path from server root (e.g. /uploads/...)
        return `${environment.socketUrl}${path}`;
    }

    openImage(path: string | undefined): void {
        const url = this.getImageUrl(path);
        if (url) window.open(url, '_blank');
    }

    constructor(
        private adminService: AdminService,
        public langService: LanguageService
    ) { }

    ngOnInit(): void {
        this.loadStadiums();
    }

    getEmptyForm(): StadiumForm {
        return {
            name: '',
            location: '',
            city: '',
            capacity: null,
            image: '',
            layout_image: '',
            description: ''
        };
    }

    loadStadiums(): void {
        this.loading = true;
        this.error = null;

        this.adminService.getStadiums().subscribe({
            next: (response) => {
                this.stadiums = response.stadiums || response;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load stadiums';
                console.error(err);
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.stadiums];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(query) ||
                v.location.toLowerCase().includes(query) ||
                (v.city && v.city.toLowerCase().includes(query))
            );
        }

        // Apply active filter
        if (this.filterActive !== 'all') {
            const isActive = this.filterActive === 'active';
            filtered = filtered.filter(v => v.is_active === isActive);
        }

        this.filteredStadiums = filtered;
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    openAddModal(): void {
        this.isEditMode = false;
        this.stadiumForm = this.getEmptyForm();
        this.editingStadiumId = null;
        this.showModal = true;
    }

    openEditModal(stadium: Stadium): void {
        this.isEditMode = true;
        this.editingStadiumId = stadium._id;
        this.stadiumForm = {
            name: stadium.name,
            location: stadium.location,
            city: stadium.city || '',
            capacity: stadium.capacity || null,
            image: stadium.image || '',
            layout_image: stadium.layout_image || '',
            description: stadium.description || ''
        };
        // Reset file selections
        this.selectedImageFile = null;
        this.selectedLayoutFile = null;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.stadiumForm = this.getEmptyForm();
        this.editingStadiumId = null;
        this.selectedImageFile = null;
        this.selectedLayoutFile = null;
    }

    onImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedImageFile = file;
        }
    }

    onLayoutSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedLayoutFile = file;
        }
    }

    saveStadium(): void {
        if (!this.stadiumForm.name || !this.stadiumForm.location || !this.stadiumForm.city) {
            this.error = 'Name, location and city are required';
            return;
        }

        this.loading = true;
        this.error = null;

        const formData = new FormData();
        formData.append('name', this.stadiumForm.name);
        formData.append('location', this.stadiumForm.location);
        formData.append('city', this.stadiumForm.city);
        if (this.stadiumForm.capacity) formData.append('capacity', this.stadiumForm.capacity.toString());
        formData.append('description', this.stadiumForm.description);
        formData.append('is_active', 'true');

        if (this.selectedImageFile) {
            formData.append('image', this.selectedImageFile);
        } else if (this.stadiumForm.image) {
            // If editing and no new file, we don't need to send image unless we want to keep it?
            // Actually, backend needs to handle "if no file, keep old".
            // If we send string URL, backend logic I wrote only checks req.files.
            // If we are editing, backend doesn't overwrite if not provided.
            // BUT if we want to support deleting image? Not implemented yet.
            // Simple: If no file selected, backend won't update image field.
            if (!this.isEditMode) {
                // If creating and using URL manually? I removed manual URL input from logic basically by prioritizing file.
                // But if user wants to use URL still?
                // Let's support both. User can paste URL in text or upload file.
                // Backend logic: "let image = req.body.image; if req.files.image -> overwrite".
                // So we append the URL string if it exists.
                formData.append('image', this.stadiumForm.image);
            }
        }

        if (this.selectedLayoutFile) {
            formData.append('layout_image', this.selectedLayoutFile);
        } else if (this.stadiumForm.layout_image) {
            if (!this.isEditMode) formData.append('layout_image', this.stadiumForm.layout_image);
        }

        const request = this.isEditMode && this.editingStadiumId
            ? this.adminService.updateStadium(this.editingStadiumId, formData)
            : this.adminService.createStadium(formData);

        request.subscribe({
            next: () => {
                this.successMessage = `Stadium ${this.isEditMode ? 'updated' : 'created'} successfully`;
                this.closeModal();
                this.loadStadiums();
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to save stadium';
                this.loading = false;
            }
        });
    }

    openDeleteModal(stadium: Stadium): void {
        this.deletingStadium = stadium;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.deletingStadium = null;
    }

    confirmDelete(): void {
        if (!this.deletingStadium) return;

        this.loading = true;

        this.adminService.deleteStadium(this.deletingStadium._id).subscribe({
            next: () => {
                this.successMessage = 'Stadium deleted successfully';
                this.closeDeleteModal();
                this.loadStadiums();
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                this.error = 'Failed to delete stadium';
                console.error(err);
                this.loading = false;
            }
        });
    }

    openViewModal(stadium: Stadium): void {
        this.loading = true;

        // Fetch full details with halls
        this.adminService.getStadiumById(stadium._id).subscribe({
            next: (data) => {
                this.viewingStadium = data;
                this.showViewModal = true;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load stadium details';
                console.error(err);
                this.loading = false;
            }
        });
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.viewingStadium = null;
    }

    toggleStatus(stadium: Stadium): void {
        const updatedData = {
            ...stadium,
            is_active: !stadium.is_active
        };

        this.adminService.updateStadium(stadium._id, updatedData).subscribe({
            next: () => {
                this.successMessage = `Stadium ${updatedData.is_active ? 'activated' : 'deactivated'}`;
                this.loadStadiums();
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                this.error = 'Failed to update stadium status';
                console.error(err);
            }
        });
    }

    // Helper for UI
    // hasMissingMaps removed

    getTotalHallCapacity(stadium: any): number {
        if (!stadium.halls) return 0;
        return stadium.halls.reduce((sum: number, h: any) => sum + (h.capacity || 0), 0);
    }

    // ============== HALL MANAGEMENT ==============
    showHallModal = false;
    isHallEditMode = false;
    editingHallId: string | null = null;
    hallForm: {
        name: string;
        capacity: number;
        section_side: string;
        gate: string;
        classification: string;
        base_price: number | null;
        seat_categories: { name: string, count: number }[];
    } = {
            name: '',
            capacity: 0,
            section_side: 'neutral',
            gate: '',
            classification: '',
            base_price: null,
            seat_categories: []
        };

    openAddHallModal(): void {
        this.isHallEditMode = false;
        this.editingHallId = null;
        this.hallForm = {
            name: '',
            capacity: 100,
            section_side: 'neutral',
            gate: '',
            classification: '',
            base_price: null,
            seat_categories: []
        };
        this.showHallModal = true;
    }

    openEditHallModal(hall: any): void {
        this.isHallEditMode = true;
        this.editingHallId = hall._id;
        this.hallForm = {
            name: hall.name,
            capacity: hall.capacity,
            section_side: hall.section_side || 'neutral',
            gate: hall.gate || '',
            classification: hall.classification || '',
            base_price: hall.base_price || null,
            seat_categories: hall.seat_categories || []
        };
        this.showHallModal = true;
    }

    closeHallModal(): void {
        this.showHallModal = false;
        this.hallForm = {
            name: '',
            capacity: 0,
            section_side: 'neutral',
            gate: '',
            classification: '',
            base_price: null,
            seat_categories: []
        };
        this.editingHallId = null;
    }

    addSeatCategory(): void {
        this.hallForm.seat_categories.push({ name: '', count: 0 });
    }

    removeSeatCategory(index: number): void {
        this.hallForm.seat_categories.splice(index, 1);
    }

    saveHall(): void {
        if (!this.viewingStadium) return;

        // Validation: Check Capacity vs Categories
        const totalSeats = this.hallForm.seat_categories.reduce((sum, cat) => sum + (Number(cat.count) || 0), 0);
        if (this.hallForm.capacity && totalSeats > this.hallForm.capacity) {
            alert(`Error: Total seats in categories (${totalSeats}) cannot exceed Hall Capacity (${this.hallForm.capacity})!`);
            return;
        }

        this.loading = true;
        const hallData = {
            ...this.hallForm,
            stadium_id: this.viewingStadium._id
        };

        const request = this.isHallEditMode && this.editingHallId
            ? this.adminService.updateHall(this.editingHallId, hallData)
            : this.adminService.createHall(hallData);

        request.subscribe({
            next: () => {
                // Refresh venue details to see new hall
                if (this.viewingStadium) {
                    this.openViewModal(this.viewingStadium); // Reloads venue data
                }
                this.loadStadiums(); // Refresh the main list
                this.closeHallModal();
                this.successMessage = `Hall ${this.isHallEditMode ? 'updated' : 'added'} successfully`;
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                console.error(err);
                this.error = 'Failed to save hall';
                this.loading = false;
            }
        });
    }

    deleteHall(hallId: string): void {
        if (!confirm('Are you sure you want to delete this hall?')) return;

        this.loading = true;
        this.adminService.deleteHall(hallId).subscribe({
            next: () => {
                if (this.viewingStadium) {
                    this.openViewModal(this.viewingStadium);
                }
                this.loadStadiums();
                this.successMessage = 'Hall deleted successfully';
                setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
                console.error(err);
                this.error = 'Failed to delete hall';
                this.loading = false;
            }
        });
    }
}
