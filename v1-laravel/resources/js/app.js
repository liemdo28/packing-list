import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();

// Notification polling
document.addEventListener('alpine:init', () => {
    Alpine.store('notifications', {
        unreadCount: 0,
        items: [],
        async fetchUnread() {
            try {
                const res = await fetch('/notifications/unread-count');
                const data = await res.json();
                this.unreadCount = data.count;
            } catch (e) {
                console.error('Failed to fetch notifications', e);
            }
        },
        async fetchRecent() {
            try {
                const res = await fetch('/notifications/recent');
                const data = await res.json();
                this.items = data;
            } catch (e) {
                console.error('Failed to fetch notifications', e);
            }
        },
        init() {
            this.fetchUnread();
            setInterval(() => this.fetchUnread(), 30000);
        }
    });
});
