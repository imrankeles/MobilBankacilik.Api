module.exports = {
    // YYYY-MM-DD formatı
    formatDate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },

    // YYYY-MM-DD HH:mm:ss formatı (DB için ideal)
    formatDateTime(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // Sadece timestamp döndürür
    timestamp() {
        return Date.now();
    },

    // X gün ekle
    addDays(date = new Date(), days = 1) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }
};
